import QCSDemo from '@/components/demo/QCSDemo';

const QCSDemoPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            QCS Scoring System Demo
          </h1>
          <p className="text-muted-foreground text-lg">
            See how our advanced Quality Compatibility Score calculation works with real user data
          </p>
        </div>
        
        <QCSDemo />
      </div>
    </div>
  );
};

export default QCSDemoPage;