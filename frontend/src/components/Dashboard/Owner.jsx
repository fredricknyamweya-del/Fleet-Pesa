 import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

const weeklyRevenue = [
	{ day: 'Mon', revenue: 38000 },
	{ day: 'Tue', revenue: 45000 },
	{ day: 'Wed', revenue: 42000 },
	{ day: 'Thu', revenue: 39000 },
	{ day: 'Fri', revenue: 52000 },
	{ day: 'Sat', revenue: 62000 },
	{ day: 'Sun', revenue: 48000 },
]

const driverRemittances = [
	{ initials: 'JK', name: 'Joseph Kamau', type: 'Matatu', vehicle: 'KBZ 234K', collected: 4500, expected: 4500, status: 'Paid', time: '08:42 AM' },
	{ initials: 'GW', name: 'Grace Wanjiku', type: 'Boda Boda', vehicle: 'KCA 891B', collected: 1200, expected: 1500, status: 'Short', time: '09:15 AM', action: 'Review' },
	{ initials: 'PO', name: 'Peter Omondi', type: 'Matatu', vehicle: 'KDG 567M', collected: 0, expected: 4500, status: 'Late', time: '—' },
	{ initials: 'MA', name: 'Mary Achieng', type: 'Boda Boda', vehicle: 'KBF 112A', collected: 1500, expected: 1500, status: 'Paid', time: '07:55 AM' },
	{ initials: 'DM', name: 'David Mwangi', type: 'Matatu', vehicle: 'KDD 789P', collected: 0, expected: 4500, status: 'Overdue', time: '—', action: 'Review' },
	{ initials: 'FN', name: 'Faith Njeri', type: 'Boda Boda', vehicle: 'KCE 445T', collected: 1500, expected: 1500, status: 'Paid', time: '10:03 AM' },
	{ initials: 'SK', name: 'Samuel Kipchoge', type: 'Matatu', vehicle: 'KBM 678G', collected: 4500, expected: 4500, status: 'Paid', time: '11:20 AM' },
	{ initials: 'EN', name: 'Esther Nyambura', type: 'Boda Boda', vehicle: 'KCH 321R', collected: 900, expected: 1500, status: 'Short', time: '09:47 AM', action: 'Review' },
]

function formatCurrency(value) {
	return `KES ${value.toLocaleString('en-KE')}`
}

function RevenueTooltip({ active, payload, label }) {
	if (!active || !payload?.length) return null

	return (
		<div className="chart-tooltip">
			<strong>{label}</strong>
			<span>{formatCurrency(payload[0].value)}</span>
		</div>
	)
}

function formatAmount(value) {
	return `KES ${value.toLocaleString('en-KE')}`
}

function statusClass(status) {
	return `status-badge status-${status.toLowerCase()}`
}

export function Owner() {
	return (
		<div className="owner-dashboard">
			<section className="revenue-card" aria-labelledby="weekly-revenue-title">
				<div className="card-heading">
					<div>
						<h2 id="weekly-revenue-title">Weekly Revenue</h2>
						<p>Last 7 days · daily target KES 42,000</p>
					</div>
					<div className="chart-legend" aria-label="Chart legend">
						<span><i className="legend-dot revenue-dot" />Revenue</span>
						<span><i className="legend-dot target-dot" />Target</span>
					</div>
				</div>
				<div className="revenue-chart">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={weeklyRevenue} margin={{ top: 10, right: 8, left: 4, bottom: 4 }}>
							<CartesianGrid stroke="#e8eef4" strokeDasharray="3 4" vertical={false} />
							<XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9aacc2', fontSize: 12 }} />
							<YAxis
								axisLine={false}
								tickLine={false}
								tick={{ fill: '#9aacc2', fontSize: 12 }}
								tickFormatter={(value) => `${value / 1000}k`}
								width={36}
								domain={[0, 80000]}
							/>
							<Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#cbd8e5', strokeDasharray: '4 4' }} />
							<Line type="monotone" dataKey="revenue" stroke="#203f68" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#0ca653', strokeWidth: 0 }} />
						</LineChart>
					</ResponsiveContainer>
				</div>
			</section>

			<section className="remittances-card" aria-labelledby="remittances-title">
				<div className="table-heading">
					<div>
						<h2 id="remittances-title">Driver Remittances</h2>
						<p>Today's collection status</p>
					</div>
					<button className="filter-button" type="button" aria-label="Filter remittances">Filter</button>
				</div>
				<div className="remittances-table-wrap">
					<table className="remittances-table">
						<thead>
							<tr>
								<th>Driver</th><th>Vehicle</th><th>Collected</th><th>Status</th><th>Time</th><th aria-label="Actions" />
							</tr>
						</thead>
						<tbody>
							{driverRemittances.map((driver) => (
								<tr key={driver.vehicle}>
									<td><div className="driver-cell"><span className="driver-table-avatar">{driver.initials}</span><span><strong>{driver.name}</strong><small>{driver.type}</small></span></div></td>
									<td className="vehicle-cell">{driver.vehicle}</td>
									<td><strong className="collected-amount">{formatAmount(driver.collected)}</strong><small className="expected-label">of {formatAmount(driver.expected)}</small></td>
									<td><span className={statusClass(driver.status)}>{driver.status}</span></td>
									<td className="time-cell">{driver.time}</td>
									<td className="action-cell">{driver.action && <button className="review-button" type="button">{driver.action}</button>}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	)
}
