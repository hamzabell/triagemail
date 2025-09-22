// Simple email verification service
// For now, this just logs the verification code
// In production, you would integrate with a real email service like Resend, SendGrid, etc.

export interface VerificationEmailData {
  email: string;
  code: string;
  userName?: string;
}

export class EmailService {
  static async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    try {
      // For development/testing, just log the verification code
      console.log(`📧 Verification Code for ${data.email}: ${data.code}`);

      // In production, you would integrate with a real email service:
      // Example with Resend:
      // const resend = new Resend(process.env.RESEND_API_KEY);
      // await resend.emails.send({
      //   from: 'your-app@yourdomain.com',
      //   to: [data.email],
      //   subject: 'Verify Your Gmail Account',
      //   html: this.getVerificationEmailTemplate(data),
      // });

      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }

  static getVerificationEmailTemplate(data: VerificationEmailData): string {
    return `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
          <h2 style="color: #333; margin-bottom: 20px;">Verify Your Gmail Account</h2>
          <p style="color: #666; margin-bottom: 30px; font-size: 16px;">
            Thank you for registering your Gmail account. Please use the verification code below to complete your registration:
          </p>
          <div style="background-color: #FF3366; color: white; padding: 15px 30px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin-bottom: 30px;">
            ${data.code}
          </div>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
            This code will expire in 24 hours. If you didn't request this verification, please ignore this email.
          </p>
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; color: #999; font-size: 12px;">
            <p>This is an automated message from your application. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    `;
  }

  static async sendWelcomeEmail(email: string, apiKey: string): Promise<boolean> {
    try {
      console.log(`📧 Welcome email sent to ${email} with API key: ${apiKey.substring(0, 8)}...`);

      // In production, send welcome email with API key
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }
}
