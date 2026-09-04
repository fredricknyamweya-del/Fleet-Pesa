import { CarFront, ClipboardList, Grid2X2, LogOut, Settings,Users} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { logout } from '../../lib/api.js'

const navigation = [
	{ label: 'Dashboard', icon: Grid2X2, to: '/owner/dashboard' },
	{label:"Drivers",icon: Users, to:"/owner/drivers"},
	{ label: 'Fleet', icon: CarFront, to: '/owner/fleet' },
	{ label: 'Remittance History', icon: ClipboardList, to: '/vehicles/mock-1/remittances' },
]

export function Sidebar() {
	const navigate = useNavigate()
	const { logout, user } = useAuth()
	const initials = (user?.name || 'Fleet Owner').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

	async function handleSignOut() {
	try {
		await logout()

		navigate('/login', {
		replace: true,
		state: {
			success: 'Successfully signed out.',
		},
		})
	} catch (error) {
		console.error('Sign out failed:', error)
	}
	}



	return (
		<aside className="sidebar">
			<div className="brand">
				<img className="brand-logo" src="/FleetPesa%20FavIcon.jpg" alt="FleetPesa" />
			</div>

			<div className="owner-profile">
				<div className="owner-avatar">{user?.profile_picture ? <img src={user.profile_picture} alt="" /> : initials}</div>
				<div>
					<strong>{user?.name || 'Fleet Owner'}</strong>
					<span>Fleet Owner</span>
				</div>
			</div>

			<nav className="sidebar-nav" aria-label="Main navigation">
				{navigation.map(({ label, icon: Icon, to, badge }) => (
					<NavLink
						className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
						to={to}
						key={label}
					>
						<Icon size={18} strokeWidth={1.8} />
						<span>{label}</span>
						{badge && <b>{badge}</b>}
					</NavLink>
				))}
			</nav>

			<div className="sidebar-footer">
				<NavLink
					className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
					to="/owner/settings"
				>
					<Settings size={18} strokeWidth={1.8} /><span>Settings</span>
				</NavLink>
				<button className="nav-item" type="button" onClick={handleSignOut}><LogOut size={18} strokeWidth={1.8} /><span>Sign Out</span></button>
			</div>
		</aside>
	)
}