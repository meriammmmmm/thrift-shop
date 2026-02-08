import { useEffect } from "react";
import useAuth from "../../../../hooks/useAuth";
import { getUserAnswers } from "../../../../redux/slices/answerSlice";
import { useDispatch, useSelector } from "../../../../redux/store";
import { isChoiceTrue, isChoiceTrueForPreview, isChoiceCorrectButNotSelected, isChoiceCorrectButNotSelectedShare } from "../../../../utils/display/result/funcs";
import { getCorrectAnswerMessage, getWrongAnswerMessage, getCorrectAnswerMissingMessage } from "../../utils/getLabel";
import parse from "html-react-parser";

type Props = {
  question: IQuestion;
  quiz: IQuiz;
};

function ResultDetailTextChoice({ question, quiz }: Props) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { savedAnswers, answers, isPreview } = useSelector((state) => state.answer);

  useEffect(() => {
    if (user && !isPreview)
      dispatch(getUserAnswers({
        quizId: quiz?._id,
        questionId: question?._id,
        userId: user?._id || "",
      }));
  }, []);

  // Get user's answers for this question
  let answersToCheck = [];
  try {
    answersToCheck = JSON.parse(localStorage.getItem("answers") || "[]");
  } catch (e) {
    answersToCheck = [];
  }

  if (isPreview && answers && answers.length > 0) {
    const reduxAnswers = answers as { questionId: string | null; choices: string[] }[];
    if (reduxAnswers.length > 0) {
      answersToCheck = reduxAnswers;
    }
  }

  if (!isPreview && savedAnswers && savedAnswers.length > 0) {
    const convertedAnswers = savedAnswers.map((answer: any) => ({
      questionId: typeof answer?.question === 'string' ? answer.question : answer?.question?._id,
      choices: answer?.choices?.map((choice: any) => choice._id || choice) || []
    }));
    if (convertedAnswers.length > 0) {
      answersToCheck = convertedAnswers;
    }
  }

  const answerForQuestion = answersToCheck.find((answer: any) => answer?.questionId === question._id);
  const userSelectedChoices = answerForQuestion?.choices || [];

  // Check if user got ANY correct answers for this question
  const userGotAtLeastOneCorrect = question.choices.some(choice => 
    choice.isTrue && userSelectedChoices.includes(choice._id)
  );

  console.log("🔍 ResultDetailTextChoice Debug:", {
    questionId: question._id,
    questionTitle: question.title,
    userSelectedChoices,
    userGotAtLeastOneCorrect,
    choices: question.choices.map(c => ({ id: c._id, answer: c.answer, isTrue: c.isTrue }))
  });

  return (
    <>
      {question?.choices.map((choice: IChoice, index: number) => {
        const userSelectedThisChoice = userSelectedChoices.includes(choice._id);
        const isCorrectAnswer = choice.isTrue || false;

        // Determine border color based on user's interaction with this choice
        let borderClass = "";
        let answerState = "";

        if (userSelectedThisChoice && !isCorrectAnswer) {
          // User selected this wrong choice - RED
          borderClass = "item-choice-text-wrong";
          answerState = getWrongAnswerMessage(quiz?.language);
        } else if (isCorrectAnswer) {
          // ANY correct answer (selected or missed) - ALWAYS GREEN
          borderClass = "item-choice-text-on";
          if (userSelectedThisChoice) {
            answerState = getCorrectAnswerMessage(quiz?.language);
          } else {
            answerState = getCorrectAnswerMissingMessage(quiz?.language);
          }
        }

        // If user didn't select it AND it's wrong, keep default blue border
        // If user didn't get any correct answers, don't show missed correct answers

        console.log("🔍 Choice analysis:", {
          choiceId: choice._id,
          choiceText: choice.answer?.substring(0, 30),
          userSelectedThisChoice,
          isCorrectAnswer,
          userGotAtLeastOneCorrect,
          borderClass,
          answerState
        });

        return (
          <div key={`item-choices-${index}`} className="item-choices-text">
            <div className={`item-choice-text ${borderClass}`}>
              <div className={`check-mark-text ${isCorrectAnswer ? "check-mark-text-on" : "check-mark-text-off"} ${userSelectedThisChoice && !isCorrectAnswer && "check-mark-text-wrong"}`}>
                {userSelectedThisChoice && !isCorrectAnswer ? (
                  <svg
                    width="24"
                    height="25"
                    viewBox="0 0 24 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12.2383"
                      r="9"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <path
                      d="M8 12.2383L11 15.2383L16 9.23828"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </svg>
                ) : (
                  <svg
                    width="24"
                    height="25"
                    viewBox="0 0 24 25"
                    fill="none"
                    color="#087713"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12.3657"
                      r="9"
                      stroke="#087713"
                      strokeWidth="2"
                    />
                    <path
                      d="M8 12.3657L11 15.3657L16 9.36572"
                      stroke="#087713"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </div>
              <p className="choice-description">{parse(choice?.answer || "")}</p>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default ResultDetailTextChoice;