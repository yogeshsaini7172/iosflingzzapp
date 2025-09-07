import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import QCSFixer from '@/components/debug/QCSFixer';
import UserSelector from '@/components/debug/UserSelector';
import DeterministicPairingTest from '@/components/debug/DeterministicPairingTest';

const AdminDebugPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-destructive">
              <Shield className="w-6 h-6" />
              Admin Debug Tools - Internal Use Only
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              These tools are for debugging and administrative purposes only. 
              They should never be exposed to regular users in production.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <QCSFixer />
            <DeterministicPairingTest />
          </div>
          
          <div className="space-y-6">
            <UserSelector />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDebugPage;