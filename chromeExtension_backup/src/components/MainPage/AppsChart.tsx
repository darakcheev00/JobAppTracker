import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../../utils/chrome-storage-utils';

import { ComposedChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Label, CartesianGrid, ResponsiveContainer  } from 'recharts';

import { table } from 'console';

type AppsChartProps = {
    tableData: Message[] | undefined;
    dataFilter: number;
}

type ChartDailyData = {
    date: string;
    dailyCountAll: number;
    Applied_today: number;
    Rejected_today: number;
    Cumulative: number;
}

enum Ranges {
    WEEK = 7,
    MONTH = 31,
}

const monthMap: Record<number, string> = {
    0: 'Jan',
    1: 'Feb',
    2: 'Mar',
    3: 'Apr',
    4: 'May',
    5: 'Jun',
    6: 'Jul',
    7: 'Aug',
    8: 'Sep',
    9: 'Oct',
    10: 'Nov',
    11: 'Dec',
};

const clr_appsent = '#fff157';
const clr_actionReq = '#ffd190';
const clr_rejected = '#fc5565';
const clr_interview = '#c8e6c9';
const clr_offer = '#dcc8e6';
const clr_other = '#9ddaf7';
const clr_button_pressed = "#646464";

export default function AppsChart({ tableData, dataFilter }: AppsChartProps) {

    const [chartDates, setChartDates] = useState<Date[]>();

    const [chartData, setChartData] = useState<ChartDailyData[]>();
    const [displayedChartData, setDisplayedChartData] = useState<ChartDailyData[]>();

    const [dateRange, setDateRange] = useState<number>(Ranges.MONTH);

    const dayLen = 86400000; //24 * 60 * 60 * 1000

    const calcDates = () => {
        const now = new Date();
        let dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        let dates: Date[] = [];

        for (let i = Ranges.MONTH - 1; i >= 0; i--) {
            const dateToAdd = new Date(dayStart.valueOf() - (i * dayLen));
            dates.push(dateToAdd);
        }
        setChartDates(dates);
    }

    const calcChartData = () => {
        if (chartDates && tableData) {
            let data: ChartDailyData[] = [];
            let cumulCount = 0;

            for (let i = 0; i < chartDates.length; i++) {
                const curr = chartDates[i].valueOf();
                const next = curr + dayLen;

                // let dayCountAll = tableData ? tableData.filter(item => {
                //     return curr <= item.internalDate && item.internalDate < next
                // }).length : 0;

                let dayCountApplied = tableData ? tableData.filter(item => {
                    return curr <= item.internalDate && item.internalDate < next && item.gptRes.status === "application received"
                }).length : 0;


                let dayCountRejected = tableData ? tableData.filter(item => {
                    return curr <= item.internalDate && item.internalDate < next && item.gptRes.status === "rejected"
                }).length : 0;


                cumulCount += dayCountApplied;

                data.push({
                    date: `${monthMap[chartDates[i].getMonth()]} ${chartDates[i].getDate()}`,
                    dailyCountAll: 0,
                    Applied_today: dayCountApplied,
                    Rejected_today: dayCountRejected,
                    Cumulative: cumulCount,
                });
            }
            setChartData(data);
        }
    }

    useEffect(() => {
        calcDates();
    }, []);

    useEffect(() => {
        if (tableData && chartDates) {
            calcChartData();
        }
    }, [tableData, chartDates]);

    useEffect(() => {
        setDisplayedChartData(chartData?.slice(-dateRange));
    }, [chartData, dateRange]);


    return (
        <div>
            <div>
                <button onClick={() => setDateRange(Ranges.WEEK)}
                    style={{
                        backgroundColor: dateRange === Ranges.WEEK ? clr_button_pressed : '#1a1a1a'
                    }}>Week</button>
                <button onClick={() => setDateRange(Ranges.MONTH)}
                    style={{
                        backgroundColor: dateRange === Ranges.MONTH ? clr_button_pressed : '#1a1a1a'
                    }}>Month</button>
            </div>
            <ComposedChart width={700} height={250} data={displayedChartData}>
                <CartesianGrid strokeDasharray="1 3" vertical={false} />

                <XAxis dataKey="date" label={{ value: 'Date', offset: 0, position: 'insideBottom' }} />
                <YAxis yAxisId="left" label={{ value: 'Daily Count', offset: 0, angle: -90 }} />
                <YAxis yAxisId="right" label={{ value: 'Cumulative Count', offset: 20, angle: -90 }} orientation="right" />

                <Tooltip 
                    contentStyle={{
                        color: 'black',
                        background: 'black'
                    }}
                    labelStyle={{
                        color: 'white'
                    }}
                />

                {(dataFilter == 0 || dataFilter == 1) && <Bar yAxisId="left" dataKey="Applied_today" fill={clr_appsent} />}
                {(dataFilter == 0 || dataFilter == 1) && <Line yAxisId="right" type="monotone" dataKey="Cumulative" dot={false} stroke={clr_appsent} />}
                
                {(dataFilter == 0 || dataFilter == 2) && <Bar yAxisId="left" dataKey="Rejected_today" fill={clr_rejected} />}
            </ComposedChart>
        </div>
    )
}


