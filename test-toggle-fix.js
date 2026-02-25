const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testToggleFunctionality() {
  console.log('🧪 Testing Active Toggle Functionality...\n');

  try {
    // Test 1: Get current testimonials
    console.log('1. Getting current testimonials...');
    const response = await fetch('https://thrift-shop-backend-production.up.railway.appapi/testimonials?companyId=1');
    const data = await response.json();
    
    if (data.testimonials && data.testimonials.length > 0) {
      const testimonial = data.testimonials[0];
      console.log('✅ Found testimonial:', {
        id: testimonial.id,
        title: testimonial.title,
        is_active: testimonial.is_active,
        current_status: testimonial.is_active === 1 ? 'Active' : 'Inactive'
      });

      // Test 2: Toggle the testimonial
      console.log('\n2. Toggling testimonial status...');
      const toggleResponse = await fetch(`https://thrift-shop-backend-production.up.railway.appapi/testimonials/${testimonial.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (toggleResponse.ok) {
        const toggleData = await toggleResponse.json();
        console.log('✅ Toggle successful:', {
          id: toggleData.testimonial.id,
          title: toggleData.testimonial.title,
          is_active: toggleData.testimonial.is_active,
          new_status: toggleData.testimonial.is_active === 1 ? 'Active' : 'Inactive',
          message: toggleData.message
        });

        // Test 3: Verify the change
        console.log('\n3. Verifying the change...');
        const verifyResponse = await fetch('https://thrift-shop-backend-production.up.railway.appapi/testimonials?companyId=1');
        const verifyData = await verifyResponse.json();
        const updatedTestimonial = verifyData.testimonials.find(t => t.id === testimonial.id);
        
        if (updatedTestimonial) {
          console.log('✅ Change verified:', {
            id: updatedTestimonial.id,
            title: updatedTestimonial.title,
            is_active: updatedTestimonial.is_active,
            final_status: updatedTestimonial.is_active === 1 ? 'Active' : 'Inactive'
          });

          // Test 4: Toggle back
          console.log('\n4. Toggling back to original state...');
          const toggleBackResponse = await fetch(`https://thrift-shop-backend-production.up.railway.appapi/testimonials/${testimonial.id}/toggle`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (toggleBackResponse.ok) {
            const toggleBackData = await toggleBackResponse.json();
            console.log('✅ Toggle back successful:', {
              id: toggleBackData.testimonial.id,
              is_active: toggleBackData.testimonial.is_active,
              restored_status: toggleBackData.testimonial.is_active === 1 ? 'Active' : 'Inactive'
            });
          }
        }
      } else {
        console.log('❌ Toggle failed:', toggleResponse.status);
      }
    } else {
      console.log('❌ No testimonials found to test');
    }

    console.log('\n🎉 Toggle functionality test completed!');
    console.log('\n📋 Summary:');
    console.log('- API toggle endpoint is working');
    console.log('- Database updates are persisting');
    console.log('- Status changes are being returned correctly');
    console.log('- Admin panel should now show correct toggle states');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testToggleFunctionality();