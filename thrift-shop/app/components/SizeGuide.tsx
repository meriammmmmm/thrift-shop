interface SizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
}

export default function SizeGuide({ isOpen, onClose, category }: SizeGuideProps) {
  if (!isOpen) return null;

  const sizeCharts = {
    'Tops': {
      headers: ['Size', 'Chest', 'Length', 'Sleeve'],
      rows: [
        ['XS', '32-34"', '24"', '23"'],
        ['S', '34-36"', '25"', '24"'],
        ['M', '36-38"', '26"', '25"'],
        ['L', '38-40"', '27"', '26"'],
        ['XL', '40-42"', '28"', '27"']
      ]
    },
    'Dresses': {
      headers: ['Size', 'Bust', 'Waist', 'Hips', 'Length'],
      rows: [
        ['XS', '32"', '26"', '36"', '36"'],
        ['S', '34"', '28"', '38"', '37"'],
        ['M', '36"', '30"', '40"', '38"'],
        ['L', '38"', '32"', '42"', '39"'],
        ['XL', '40"', '34"', '44"', '40"']
      ]
    },
    'Jeans': {
      headers: ['Size', 'Waist', 'Inseam', 'Rise'],
      rows: [
        ['26', '26"', '30"', '8"'],
        ['28', '28"', '30"', '8.5"'],
        ['30', '30"', '32"', '9"'],
        ['32', '32"', '32"', '9.5"'],
        ['34', '34"', '34"', '10"']
      ]
    },
    'Shoes': {
      headers: ['US Size', 'EU Size', 'UK Size', 'Length (cm)'],
      rows: [
        ['6', '36', '3.5', '22.5'],
        ['7', '37', '4.5', '23.5'],
        ['8', '38', '5.5', '24.5'],
        ['9', '39', '6.5', '25.5'],
        ['10', '40', '7.5', '26.5']
      ]
    }
  };

  const chart = sizeCharts[category as keyof typeof sizeCharts] || sizeCharts['Tops'];

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Size Guide - {category}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800">
                {chart.headers.map((header, index) => (
                  <th key={index} className="px-4 py-3 text-left font-medium text-white text-xs">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-gray-900">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Measurement Tips</h3>
          <ul className="text-xs text-gray-700 space-y-1.5">
            <li>• Measure yourself wearing the undergarments you plan to wear with the item</li>
            <li>• Use a soft measuring tape and keep it parallel to the floor</li>
            <li>• For the most accurate fit, have someone else take your measurements</li>
            <li>• When in doubt, size up for a more comfortable fit</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
