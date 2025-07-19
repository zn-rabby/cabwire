// import { ICreateAccount, IResetPassword } from '../types/emailTamplate';

// const createAccount = (values: ICreateAccount) => {
//   const data = {
//     to: values.email,
//     subject: 'Verify your account',
//     html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
//     <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
//         <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
//           <h2 style="color: #277E16; font-size: 24px; margin-bottom: 20px;">Hey! ${values.name}, Your Toothlens Account Credentials</h2>
//         <div style="text-align: center;">
//             <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your single use code is:</p>
//             <div style="background-color: #277E16; width: 80px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.otp}</div>
//             <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This code is valid for 3 minutes.</p>
//         </div>
//     </div>
// </body>`,
//   };
//   return data;
// };

// const resetPassword = (values: IResetPassword) => {
//   const data = {
//     to: values.email,
//     subject: 'Reset your password',
//     html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
//     <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
//         <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
//         <div style="text-align: center;">
//             <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your single use code is:</p>
//             <div style="background-color: #277E16; width: 80px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.otp}</div>
//             <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This code is valid for 3 minutes.</p>
//                 <p style="color: #b9b4b4; font-size: 16px; line-height: 1.5; margin-bottom: 20px;text-align:left">If you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.</p>
//         </div>
//     </div>
// </body>`,
//   };
//   return data;
// };

// export const emailTemplate = {
//   createAccount,
//   resetPassword,
// };
import { ICreateAccount, IResetPassword } from '../types/emailTamplate';

const createAccount = (values: ICreateAccount) => {
  const otpString = String(values.otp);
  const data = {
    to: values.email,
    subject: '🚀 Welcome to Cabwire - Verify Your Account',
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc;">
    <!-- Background Container -->
    <div style="background: #f8fafc; padding: 40px 20px;">
        <!-- Main Card -->
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <!-- Premium Header -->
            <div style="background: linear-gradient(90deg, #01308D 0%, #051A3F 100%); padding: 40px; text-align: center;">
                <img src="https://res.cloudinary.com/dm8gdzghf/image/upload/v1752922273/Group_1_qvaemd.png" alt="Cabwire" style="height: 42px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
                <div style="height: 4px; background: linear-gradient(270deg, #FD6D12 0%, #EE5208 100%); margin-top: 20px;"></div>
            </div>
            
            <!-- Content Area -->
            <div style="padding: 48px 40px;">
                <!-- Greeting -->
                <div style="text-align: center; margin-bottom: 36px;">
                    <h1 style="color: #051A3F; font-size: 28px; font-weight: 700; margin: 0 0 12px;">Welcome to Cabwire</h1>
                    <p style="color: #64748B; font-size: 16px; line-height: 1.5; margin: 0;">Hi ${
                      values.name
                    }, let's verify your account</p>
                </div>
                
                <!-- OTP Card -->
                <div style="background: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 24px; text-align: center; margin-bottom: 32px;">
                    <p style="color: #64748B; font-size: 15px; margin: 0 0 16px;">Your verification code</p>
                    <div style="background: linear-gradient(90deg, #01308D 0%, #051A3F 100%); color: white; font-size: 36px; font-weight: 700; letter-spacing: 6px; 
                        padding: 18px; border-radius: 10px; margin: 0 auto; display: inline-block; min-width: 280px; box-shadow: 0 4px 12px rgba(1, 48, 141, 0.15);">
                        ${otpString.split('').join(' ')}
                    </div>
                </div>
                
                <!-- Warning Card -->
                <div style="background: #FFF5F0; border-left: 4px solid #EE5208; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 32px;">
                    <div style="display: flex; align-items: center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 12px;">
                            <path d="M12 9V11M12 15H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EE5208" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <p style="color: #431407; font-size: 14px; margin: 0;">
                            <strong style="color: #EE5208;">Code expires in 3 minutes</strong> - For security, don't share this with anyone.
                        </p>
                    </div>
                </div>
                
                <!-- CTA Button -->
                <a href="#" style="display: block; background: linear-gradient(270deg, #FD6D12 0%, #EE5208 100%); color: white; text-decoration: none; text-align: center; padding: 16px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 32px; box-shadow: 0 4px 12px rgba(253, 109, 18, 0.2);">
                    Open Cabwire App
                </a>
                
                <!-- Support Text -->
                <p style="color: #94A3B8; font-size: 14px; text-align: center; line-height: 1.5; margin: 0;">
                    Need help? <a href="mailto:support@cabwire.com" style="color: #EE5208; text-decoration: none; font-weight: 500;">Contact our support team</a>
                </p>
            </div>
            
            <!-- Premium Footer -->
            <div style="background: #F8FAFC; padding: 24px; text-align: center; border-top: 1px solid #E2E8F0;">
                <!-- Social Icons -->
                <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
                    <a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #E2E8F0; border-radius: 50%;">
                        <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" width="16" alt="Facebook">
                    </a>
                    <a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #E2E8F0; border-radius: 50%;">
                        <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" width="16" alt="Twitter">
                    </a>
                    <a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #E2E8F0; border-radius: 50%;">
                        <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="16" alt="Instagram">
                    </a>
                </div>
                
                <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; margin: 0;">
                    © ${new Date().getFullYear()} Cabwire Technologies Inc.<br>
                    Revolutionizing urban mobility and package delivery
                </p>
            </div>
        </div>
    </div>
</body>
</html>`,
  };
  return data;
};

const resetPassword = (values: IResetPassword) => {
  const otpString = String(values.otp);
  const data = {
    to: values.email,
    subject: '🔐 Cabwire - Password Reset Request',
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc;">
    <!-- Background Container -->
    <div style="background: #f8fafc; padding: 40px 20px;">
        <!-- Main Card -->
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <!-- Premium Header -->
            <div style="background: linear-gradient(90deg, #01308D 0%, #051A3F 100%); padding: 40px; text-align: center;">
                <img src="https://res.cloudinary.com/dm8gdzghf/image/upload/v1752922273/Group_1_qvaemd.png" alt="Cabwire" style="height: 42px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
                <div style="height: 4px; background: linear-gradient(270deg, #FD6D12 0%, #EE5208 100%); margin-top: 20px;"></div>
            </div>
            
            <!-- Content Area -->
            <div style="padding: 48px 40px;">
                <!-- Greeting -->
                <div style="text-align: center; margin-bottom: 36px;">
                    <h1 style="color: #051A3F; font-size: 28px; font-weight: 700; margin: 0 0 12px;">Password Reset</h1>
                    <p style="color: #64748B; font-size: 16px; line-height: 1.5; margin: 0;">Here's your verification code to reset your password</p>
                </div>
                
                <!-- OTP Card -->
                <div style="background: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 24px; text-align: center; margin-bottom: 32px;">
                    <p style="color: #64748B; font-size: 15px; margin: 0 0 16px;">Your verification code</p>
                    <div style="background: linear-gradient(90deg, #01308D 0%, #051A3F 100%); color: white; font-size: 36px; font-weight: 700; letter-spacing: 6px; 
                        padding: 18px; border-radius: 10px; margin: 0 auto; display: inline-block; min-width: 280px; box-shadow: 0 4px 12px rgba(1, 48, 141, 0.15);">
                        ${otpString.split('').join(' ')}
                    </div>
                </div>
                
                <!-- Security Alert -->
                <div style="background: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 32px;">
                    <div style="display: flex; align-items: center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 12px;">
                            <path d="M12 9V11M12 15H12.01M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <p style="color: #431407; font-size: 14px; margin: 0;">
                            <strong style="color: #DC2626;">For security:</strong> Never share this code with anyone.
                        </p>
                    </div>
                </div>
                
                <!-- CTA Button -->
                <a href="#" style="display: block; background: linear-gradient(270deg, #FD6D12 0%, #EE5208 100%); color: white; text-decoration: none; text-align: center; padding: 16px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 32px; box-shadow: 0 4px 12px rgba(253, 109, 18, 0.2);">
                    Reset Password Now
                </a>
                
                <!-- Security Notice -->
                <div style="background: #F8FAFC; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <p style="color: #64748B; font-size: 14px; line-height: 1.5; margin: 0;">
                        If you didn't request this password reset, please secure your account immediately or contact our <a href="mailto:support@cabwire.com" style="color: #EE5208; text-decoration: none; font-weight: 500;">support team</a>.
                    </p>
                </div>
            </div>
            
            <!-- Premium Footer -->
            <div style="background: #F8FAFC; padding: 24px; text-align: center; border-top: 1px solid #E2E8F0;">
                <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; margin: 0;">
                    © ${new Date().getFullYear()} Cabwire Technologies Inc.<br>
                    Revolutionizing urban mobility and package delivery
                </p>
            </div>
        </div>
    </div>
</body>
</html>`,
  };
  return data;
};

export const emailTemplate = {
  createAccount,
  resetPassword,
};
