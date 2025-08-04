import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AuthStatus {
  hasApiKey: boolean;
  hasTokens: boolean;
  isExpired: boolean;
  expiresIn?: number;
  message: string;
}

interface AuthResponse {
  message: string;
  pin: string;
  authorizationCode: string;
  expiresIn: number;
  instructions: string[];
}

export default function EcobeeAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const [authCode, setAuthCode] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/thermostats/auth/status');
      const data = await response.json();
      setStatus(data);
      setMessage(null);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to check status' });
    }
    setIsLoading(false);
  };

  const startAuth = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/thermostats/auth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      setAuthData(data);
      setMessage({ type: 'success', text: 'Authentication started! Follow the instructions below.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to start authentication' });
    }
    setIsLoading(false);
  };

  const completeAuth = async () => {
    if (!authData?.authorizationCode) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/thermostats/auth/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizationCode: authData.authorizationCode }),
      });
      const data = await response.json();
      setMessage({ type: 'success', text: data.message });
      setAuthData(null);
      await checkStatus(); // Refresh status
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to complete authentication' });
    }
    setIsLoading(false);
  };

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Ecobee Thermostat Authentication</span>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert>
            {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {message.type === 'error' && <AlertTriangle className="h-4 w-4" />}
            {message.type === 'info' && <Info className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button onClick={checkStatus} disabled={isLoading} variant="outline">
            Check Status
          </Button>
          <Button onClick={startAuth} disabled={isLoading}>
            Start Authentication
          </Button>
        </div>

        {status && (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">API Key:</span>
                  <span className={status.hasApiKey ? 'text-green-600' : 'text-red-600'}>
                    {status.hasApiKey ? 'Configured' : 'Missing'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Authentication:</span>
                  <span className={status.hasTokens && !status.isExpired ? 'text-green-600' : 'text-orange-600'}>
                    {status.hasTokens 
                      ? status.isExpired 
                        ? 'Expired' 
                        : `Active (${formatTimeRemaining(status.expiresIn || 0)})` 
                      : 'Not authenticated'
                    }
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{status.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {authData && (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">PIN: {authData.pin}</div>
                  <p className="text-sm text-muted-foreground">Enter this PIN on ecobee.com</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {authData.instructions.map((instruction, index) => (
                      <li key={index}>{instruction.replace(`4. Enter PIN: ${authData.pin}`, `4. Enter PIN: ${authData.pin}`)}</li>
                    ))}
                  </ol>
                </div>

                <div className="text-center pt-4">
                  <Button 
                    onClick={completeAuth} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    Complete Authentication
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click after entering the PIN on ecobee.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> You need an Ecobee developer account with an API key to use this feature. 
            The authentication uses OAuth 2.0 with PIN-based authorization.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}