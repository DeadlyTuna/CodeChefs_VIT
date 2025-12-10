'use client';

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/card';

interface AnalyticsChartProps {
    data: any[];
    type: 'line' | 'bar' | 'pie';
    title: string;
    dataKey?: string;
    xAxisKey?: string;
    colors?: string[];
}

const DEFAULT_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];

export function AnalyticsChart({ data, type, title, dataKey = 'value', xAxisKey = 'name', colors = DEFAULT_COLORS }: AnalyticsChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">{title}</h3>
                <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
                    No data available
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                {type === 'line' && (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey={xAxisKey} stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={2} dot={{ fill: colors[0] }} />
                    </LineChart>
                )}
                {type === 'bar' && (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey={xAxisKey} stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey={dataKey} fill={colors[0]} radius={[8, 8, 0, 0]} />
                    </BarChart>
                )}
                {type === 'pie' && (
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey={dataKey}
                            nameKey={xAxisKey}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
                        <Legend />
                    </PieChart>
                )}
            </ResponsiveContainer>
        </Card>
    );
}
