'use client';

import { useState } from 'react';
import { signIn, fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth';
import '../../../lib/amplify-config';

export default function AuthDebugPage() {
  const [email, setEmail] = useState('akbarkhan9108@gmail.com');
  const [password, setPassword] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSignIn = async () => {
    setLogs([]);
    setLoading(true);
    
    try {
      addLog('Starting sign in...');
      
      const result = await signIn({
        username: email,
        password: password,
      });
      
      addLog(`Sign in result: ${JSON.stringify(result)}`);
      
      if (result.isSignedIn) {
        addLog('✅ Sign in successful!');
        
        // Wait and check session multiple times
        for (let i = 0; i < 5; i++) {
          addLog(`Attempt ${i + 1}: Checking session...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            const session = await fetchAuthSession({ forceRefresh: true });
            addLog(`Session tokens present: ${!!session.tokens}`);
            
            if (session.tokens?.idToken) {
              addLog(`✅ ID Token: ${session.tokens.idToken.toString().substring(0, 50)}...`);
              addLog(`Token length: ${session.tokens.idToken.toString().length}`);
              
              try {
                const user = await getCurrentUser();
                addLog(`✅ Current user: ${JSON.stringify(user)}`);
              } catch (userErr: any) {
                addLog(`❌ Get user error: ${userErr.message}`);
              }
              
              break;
            }
          } catch (sessionErr: any) {
            addLog(`❌ Session error: ${sessionErr.message}`);
          }
        }
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.name} - ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSession = async () => {
    setLogs([]);
    setLoading(true);
    
    try {
      addLog('Checking current session...');
      const session = await fetchAuthSession({ forceRefresh: true });
      addLog(`Tokens present: ${!!session.tokens}`);
      
      if (session.tokens?.idToken) {
        addLog(`✅ Has ID token`);
        addLog(`Token: ${session.tokens.idToken.toString().substring(0, 100)}...`);
      } else {
        addLog('❌ No tokens found');
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignOut = async () => {
    setLogs([]);
    setLoading(true);
    
    try {
      addLog('Signing out...');
      await signOut();
      addLog('✅ Signed out successfully');
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cognito Auth Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Sign In</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={testSignIn}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Test Sign In
              </button>
              
              <button
                onClick={testSession}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Check Session
              </button>
              
              <button
                onClick={testSignOut}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
