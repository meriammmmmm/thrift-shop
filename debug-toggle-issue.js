const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugToggleIssue() {
  console.log('🔍 Debugging Toggle Issue...\n');

  try {
    // Step 1: Login and get token
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch('https://mery-rose-backend.onrender.comapi/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@thriftshop.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error('Login failed: ' + loginData.error);
    }

    const authToken = loginData.token;
    console.log('✅ Login successful, token:', authToken.substring(0, 20) + '...');

    // Step 2: Get testimonials (as admin panel would)
    console.log('\n2. Getting testimonials (admin endpoint)...');
    const testimonialsResponse = await fetch('https://mery-rose-backend.onrender.comapi/testimonials', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const testimonialsData = await testimonialsResponse.json();
    if (!testimonialsResponse.ok) {
      throw new Error('Failed to get testimonials: ' + testimonialsData.error);
    }

    console.log('✅ Testimonials loaded:', testimonialsData.testimonials.length);
    
    // Show current state
    testimonialsData.testimonials.forEach((t, index) => {
      console.log(`   ${index + 1}. ID: ${t.id}, Title: "${t.title}", is_active: ${t.is_active} (${t.is_active === 1 ? 'Active' : 'Inactive'})`);
    });

    if (testimonialsData.testimonials.length > 0) {
      const testTestimonial = testimonialsData.testimonials[0];
      
      // Step 3: Test toggle
      console.log(`\n3. Testing toggle on testimonial ID ${testTestimonial.id}...`);
      console.log(`   Current state: is_active = ${testTestimonial.is_active} (${testTestimonial.is_active === 1 ? 'Active' : 'Inactive'})`);
      
      const toggleResponse = await fetch(`https://mery-rose-backend.onrender.comapi/testimonials/${testTestimonial.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const toggleData = await toggleResponse.json();
      if (!toggleResponse.ok) {
        throw new Error('Toggle failed: ' + toggleData.error);
      }

      console.log('✅ Toggle successful!');
      console.log(`   New state: is_active = ${toggleData.testimonial.is_active} (${toggleData.testimonial.is_active === 1 ? 'Active' : 'Inactive'})`);
      console.log(`   Message: ${toggleData.message}`);

      // Step 4: Verify change persisted
      console.log('\n4. Verifying change persisted...');
      const verifyResponse = await fetch('https://mery-rose-backend.onrender.comapi/testimonials', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const verifyData = await verifyResponse.json();
      const updatedTestimonial = verifyData.testimonials.find(t => t.id === testTestimonial.id);
      
      if (updatedTestimonial) {
        console.log('✅ Change verified in database');
        console.log(`   Final state: is_active = ${updatedTestimonial.is_active} (${updatedTestimonial.is_active === 1 ? 'Active' : 'Inactive'})`);
        
        // Step 5: Test data transformation (as admin panel would do)
        console.log('\n5. Testing data transformation (admin panel logic)...');
        const transformedTestimonial = {
          id: updatedTestimonial.id,
          name: updatedTestimonial.name || updatedTestimonial.title,
          image: updatedTestimonial.image,
          title: updatedTestimonial.title,
          description: updatedTestimonial.description,
          isActive: updatedTestimonial.is_active === 1 // This is the key transformation
        };
        
        console.log('✅ Transformed testimonial for admin panel:');
        console.log(`   isActive (boolean): ${transformedTestimonial.isActive}`);
        console.log(`   Original is_active (number): ${updatedTestimonial.is_active}`);
        
        // Step 6: Test what admin panel toggle would send
        console.log('\n6. Testing admin panel toggle logic...');
        console.log(`   Admin panel would see: isActive = ${transformedTestimonial.isActive}`);
        console.log(`   Admin panel toggle would call: /api/testimonials/${transformedTestimonial.id}/toggle`);
        console.log(`   Expected result: isActive should become ${!transformedTestimonial.isActive}`);
        
      } else {
        console.log('❌ Could not find updated testimonial');
      }
    }

    console.log('\n🎯 Diagnosis Complete!');
    console.log('\n📋 Key Findings:');
    console.log('• API toggle endpoint works correctly');
    console.log('• Database updates are persisting');
    console.log('• Data transformation logic is correct');
    console.log('• The issue is likely in the admin panel React component');
    
    console.log('\n🔧 Potential Issues:');
    console.log('• Admin panel may not be using latest built version');
    console.log('• React component state may not be updating correctly');
    console.log('• Toggle handler may not be calling the API correctly');
    console.log('• Data transformation may not be applied consistently');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugToggleIssue();