export interface TwilioCredentials {
  account_sid: string
  auth_token: string
  phone_number: string
}

export async function sendSms(credentials: TwilioCredentials, to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const auth = Buffer.from(`${credentials.account_sid}:${credentials.auth_token}`).toString("base64")

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${credentials.account_sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: credentials.phone_number, Body: body }),
    }
  )

  if (!response.ok) {
    const err = await response.json() as { message?: string }
    return { success: false, error: err.message ?? "Twilio error" }
  }

  const data = await response.json() as { sid: string }
  return { success: true, sid: data.sid }
}
