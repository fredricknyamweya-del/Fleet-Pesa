import { ArrowLeft, KeyRound, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { updatePassword, updateProfile } from '../../lib/api.js'

const sections = [
	{ id: 'profile', label: 'Profile details', icon: UserRound },
	{ id: 'password', label: 'Password', icon: KeyRound },
]

export default function DriverSettingsPage() {
	const navigate = useNavigate()
	const { user, setAuth, token, logout } = useAuth()
	const [name, setName] = useState(user?.name || '')
	const [phone, setPhone] = useState(user?.phone || '')
	const [profilePicture, setProfilePicture] = useState(user?.profile_picture || '')
	const [profileState, setProfileState] = useState({ loading: false, error: '', success: '' })
	const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmation: '' })
	const [passwordState, setPasswordState] = useState({ loading: false, error: '', success: '' })

	async function handleProfileSubmit(event) {
		event.preventDefault()
		setProfileState({ loading: true, error: '', success: '' })
		try {
			const response = token?.startsWith('mock-token')
				? await new Promise((resolve) => window.setTimeout(() => resolve({ user: { ...user, name: name.trim(), phone: phone.trim(), profile_picture: profilePicture } }), 450))
				: await updateProfile({ name: name.trim(), phone: phone.trim() })
			setAuth({ token, user: { ...response.user, profile_picture: profilePicture } })
			setProfileState({ loading: false, error: '', success: 'Profile updated successfully.' })
		} catch (error) {
			setProfileState({ loading: false, error: error.message, success: '' })
		}
	}

	async function handlePasswordSubmit(event) {
		event.preventDefault()
		if (passwords.newPassword !== passwords.confirmation) {
			setPasswordState({ loading: false, error: 'New passwords do not match.', success: '' })
			return
		}
		if (passwords.currentPassword === passwords.newPassword) {
			setPasswordState({ loading: false, error: 'New password must be different from your current password.', success: '' })
			return
		}
		setPasswordState({ loading: true, error: '', success: '' })
		try {
			if (token?.startsWith('mock-token')) await new Promise((resolve) => window.setTimeout(resolve, 450))
			else await updatePassword(passwords)
			setPasswords({ currentPassword: '', newPassword: '', confirmation: '' })
			setPasswordState({ loading: false, error: '', success: 'Password updated successfully.' })
		} catch (error) {
			setPasswordState({ loading: false, error: error.message, success: '' })
		}
	}

	function handleSignOut() {
		logout()
		navigate('/login', {
			replace: true,
			state: { success: 'Successfully signed out.' },
		})
	}

	return (
		<div className="driver-page">
			<header className="driver-header driver-settings-header">
				<div className="driver-header-inner">
					<button className="settings-back driver-settings-back" type="button" onClick={() => navigate('/driver/remittance')}>
						<ArrowLeft size={16} /> Back to dashboard
					</button>
					<div className="settings-heading driver-settings-heading">
						<p className="settings-eyebrow">Driver account</p>
						<h2>Settings</h2>
						<p>Manage your profile, security, and remittance help.</p>
					</div>
				</div>
			</header>

			<div className="settings-page">

			<div className="settings-layout">
				<nav className="settings-tabs" aria-label="Driver settings sections">
					{sections.map(({ id, label, icon: Icon }, index) => (
						<a className={`settings-tab${index === 0 ? ' active' : ''}`} href={`#${id}`} key={id}>
							<Icon size={17} strokeWidth={1.8} />
							<span>{label}</span>
						</a>
					))}
				</nav>

				<div className="settings-panels">
					<section className="settings-panel" id="profile">
						<h3>Profile details</h3>
						<p>Keep the contact details your fleet owner uses up to date.</p>
						<form onSubmit={handleProfileSubmit}>
							<label className="profile-picture-field">Profile picture<input type="file" accept="image/*" capture="user" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setProfilePicture(reader.result); reader.readAsDataURL(file) }} /></label>
							{profilePicture && <img className="profile-picture-preview" src={profilePicture} alt="Profile preview" />}
							<div className="settings-form-grid">
								<label>Name<input type="text" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} /></label>
								<label>Phone number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
							</div>
							{profileState.error && <p className="settings-error" role="alert">{profileState.error}</p>}
							{profileState.success && <p className="settings-success" role="status">{profileState.success}</p>}
							<button className="settings-primary" type="submit" disabled={profileState.loading}>{profileState.loading ? 'Saving...' : 'Save profile'}</button>
						</form>
					</section>

					<section className="settings-panel" id="password">
						<h3>Change password</h3>
						<p>Use a strong password you do not use elsewhere.</p>
						<form onSubmit={handlePasswordSubmit} className="settings-form-grid">
							<label>Current password<input type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} required /></label>
							<label>New password<input type="password" autoComplete="new-password" minLength={6} value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} required /></label>
							<label>Confirm new password<input type="password" autoComplete="new-password" minLength={6} value={passwords.confirmation} onChange={(event) => setPasswords({ ...passwords, confirmation: event.target.value })} required /></label>
							<div>
								{passwordState.error && <p className="settings-error" role="alert">{passwordState.error}</p>}
								{passwordState.success && <p className="settings-success" role="status">{passwordState.success}</p>}
								<button className="settings-secondary" type="submit" disabled={passwordState.loading}>{passwordState.loading ? 'Updating...' : 'Update password'}</button>
							</div>
						</form>
						<div className="settings-signout-wrap">
							<button className="settings-danger" type="button" onClick={handleSignOut}>Sign out</button>
						</div>
					</section>

				</div>
			</div>
			</div>
		</div>
	)
}
