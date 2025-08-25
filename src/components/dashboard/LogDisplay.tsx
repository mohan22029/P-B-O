import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface LogDisplayProps {
  logs: string[];
}

export function LogDisplay({ logs }: LogDisplayProps) {
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // This effect will run every time the 'logs' array changes
  useEffect(() => {
    // Automatically scroll to the bottom of the log container
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Terminal className="h-5 w-5 mr-2" />
          Server Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 p-4 rounded-lg h-48 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <p key={index} className="whitespace-pre-wrap">{`> ${log}`}</p>
          ))}
          {/* This empty div is the target for our auto-scroll */}
          <div ref={logEndRef} />
        </div>
      </CardContent>
    </Card>
  );
}