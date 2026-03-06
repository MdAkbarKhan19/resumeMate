const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config();

const client = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
});

async function checkCognitoUsers() {
  try {
    const command = new ListUsersCommand({
      UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      Limit: 10,
    });

    const response = await client.send(command);
    
    console.log(`\nFound ${response.Users?.length || 0} users in Cognito User Pool:\n`);
    
    response.Users?.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.Username}`);
      console.log(`   Status: ${user.UserStatus}`);
      console.log(`   Enabled: ${user.Enabled}`);
      console.log(`   Created: ${user.UserCreateDate}`);
      
      const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
      const emailVerified = user.Attributes?.find(attr => attr.Name === 'email_verified')?.Value;
      const sub = user.Attributes?.find(attr => attr.Name === 'sub')?.Value;
      
      console.log(`   Email: ${email}`);
      console.log(`   Email Verified: ${emailVerified}`);
      console.log(`   Cognito ID (sub): ${sub}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error listing users:', error);
  }
}

checkCognitoUsers();
