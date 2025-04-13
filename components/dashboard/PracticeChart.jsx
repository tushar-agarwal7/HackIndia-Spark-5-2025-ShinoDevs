// New component: components/dashboard/PracticeChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PracticeChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-gray-500">No practice data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value} min`, 'Practice Time']} />
        <Legend />
        <Line
          type="monotone"
          dataKey="minutes"
          stroke="#0ea5e9"
          activeDot={{ r: 8 }}
          name="Minutes Practiced"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}