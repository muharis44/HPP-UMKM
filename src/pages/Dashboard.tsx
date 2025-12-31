import { Card, CardContent } from '../components/ui/Card';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600">Overview dan statistik bisnis</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Backend API Needed</h2>
            <p className="text-slate-600">
              This page requires backend API endpoints for dashboard statistics and analytics to be fully implemented.
              The MySQL database is already configured and ready.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
