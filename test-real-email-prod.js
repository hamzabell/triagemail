// Test the prompt processing endpoint with realistic email data on PRODUCTION
const userEmail = 'akandev888@gmail.com';
const addonId = 'triagemail-addon';
const apiUrl = 'https://triage-mail.netlify.app/api/email/prompt';

async function testRealEmailProcessing() {
  console.log('Testing PRODUCTION prompt processing with realistic email data...');
  console.log('Email:', userEmail);
  console.log('Addon ID:', addonId);

  // Test with a realistic business email
  const payload = {
    emailId: 'business-proposal-001',
    promptId: 'summarize_key_points',
    subject: 'Proposal for Digital Transformation Initiative - Budget Approval Needed',
    body: `Dear Executive Team,

I am writing to seek approval for our proposed Digital Transformation Initiative, which represents a significant opportunity to modernize our operations and improve efficiency across all departments.

Project Overview:
- Complete system migration to cloud infrastructure
- Implementation of AI-powered analytics platform
- Mobile-first employee portal development
- Automated workflow integration across departments

Financial Summary:
- Total investment: $450,000 over 18 months
- Expected ROI: 35% within first year
- Annual operational savings: $120,000
- Implementation timeline: Q1 2025 through Q2 2026

Key Benefits:
1. 40% reduction in manual processing time
2. Real-time data analytics and reporting
3. Enhanced remote work capabilities
4. Improved customer experience metrics
5. Scalable infrastructure for future growth

Risks and Mitigation:
- Implementation disruption: Minimal with phased rollout
- Training requirements: Comprehensive training program included
- Technical challenges: Experienced vendor partnership secured

Next Steps:
- Your review and approval by December 15th
- Vendor contract signing by January 5th
- Project kickoff meeting: January 15th

This initiative aligns with our strategic goals and positions us as an industry leader in digital innovation. I've attached the detailed proposal document and vendor quotes for your review.

Please let me know if you require any additional information or would like to schedule a presentation.

Best regards,
Jennifer Martinez
Chief Technology Officer
InnovateCorp Solutions`,
    from: 'jennifer.martinez@innovatecorp.com',
  };

  const headers = {
    'X-Gmail-User-Email': userEmail,
    'X-Gmail-Addon-ID': addonId,
    'Content-Type': 'application/json',
  };

  console.log('\n--- Testing PRODUCTION endpoint with real business proposal ---');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    console.log('Status:', response.status);
    console.log('Response Headers:', {
      'content-type': response.headers.get('content-type'),
      server: response.headers.get('server'),
      'x-nf-request-id': response.headers.get('x-nf-request-id'),
    });

    if (json.success) {
      console.log('✅ PRODUCTION prompt processed successfully');
      console.log('📝 Full Result:');
      console.log(json.result.result);
      console.log('\n🎯 Confidence:', json.result.confidence);
      if (json.result.followUpQuestions && json.result.followUpQuestions.length > 0) {
        console.log('❓ Follow-up questions:', json.result.followUpQuestions);
      }
      if (json.result.actions && json.result.actions.length > 0) {
        console.log('⚡ Suggested actions:', json.result.actions);
      }
    } else {
      console.log('❌ Error:', json.error);
      console.log('Error code:', json.code);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testRealEmailProcessing();
