import { useState, useEffect } from 'react';

export function useApiPort() {
  const [apiPort, setApiPort] = useState<number>(3005);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const findApiPort = async () => {
      setIsChecking(true);
      
      // Try ports from 3005 to 3014
      for (let port = 3005; port <= 3014; port++) {
        try {
          const response = await fetch(`http://localhost:${port}/api/storage/devices`, {
            method: 'GET',
            signal: AbortSignal.timeout(1000)
          });
          
          if (response.ok) {
            console.log(`✅ Found API server on port ${port}`);
            setApiPort(port);
            break;
          }
        } catch (error) {
          // Port not available, try next
          continue;
        }
      }
      
      setIsChecking(false);
    };

    findApiPort();
    
    // Check every 30 seconds in case the server restarts on a different port
    const interval = setInterval(findApiPort, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { apiPort, isChecking };
}
