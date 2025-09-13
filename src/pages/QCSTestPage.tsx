import QCSCalculator from '@/components/QCSCalculator';

const QCSTestPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            QCS Test
          </h1>
          <p className="text-muted-foreground">
            Test QCS calculation for user: qKWmi3xeOvVbdUzUfyghkwejzZE2
          </p>
        </div>
        
        <QCSCalculator />
      </div>
    </div>
  );
};

export default QCSTestPage;