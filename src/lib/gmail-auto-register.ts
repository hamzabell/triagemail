import { createClient } from '@/utils/supabase/server';
import { generateStateToken } from './gmail/encryption';

export async function autoRegisterGmailAccount(userId: string, email: string) {
  const supabase = await createClient();

  try {
    // Only register Gmail accounts
    if (!email.endsWith('@gmail.com')) {
      return { success: false, error: 'Only Gmail accounts can be auto-registered' };
    }

    // Check if already registered
    const { data: existingAccount } = await supabase
      .from('registered_gmail_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('email', email)
      .single();

    if (existingAccount) {
      return { success: true, message: 'Account already registered' };
    }

    // Generate API key
    const apiKey = 'gmk_' + generateStateToken().slice(0, 32);

    // Create registered account (automatically verified since user signed up with this email)
    const { error: insertError } = await supabase
      .from('registered_gmail_accounts')
      .insert({
        user_id: userId,
        email: email,
        api_key: apiKey,
        is_verified: true, // Auto-verify since they signed up with this email
      })
      .select()
      .single();

    if (insertError) {
      console.error('Auto-registration error:', insertError);
      return { success: false, error: 'Failed to auto-register Gmail account' };
    }

    return {
      success: true,
      message: 'Gmail account auto-registered successfully',
      apiKey: apiKey,
    };
  } catch (error) {
    console.error('Auto-registration error:', error);
    return { success: false, error: 'Failed to auto-register Gmail account' };
  }
}
