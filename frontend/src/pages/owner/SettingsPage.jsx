import { BellRing, KeyRound, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { updatePassword, updateProfile } from '../../lib/api.js'

const sections = [
	{ id: 'profile', label: 'Profile details', icon: UserRound },
	{ id: 'notifications', label: 'Remittance alerts', icon: BellRing },
	{ id: 'password', label: 'Password', icon: KeyRound },
]

export default function SettingsPage() {
	const { user, setAuth, token } = useAuth()
	const [name, setName] = useState(user?.name || '')
	const [phone, setPhone] = useState(user?.phone || '')
	const [profilePicture, setProfilePicture] = useState(user?.profile_picture || '')
	const [notificationPreference, setNotificationPreference] = useState(user?.notification_preference || 'none')
	const [profileState, setProfileState] = useState({ loading: false, error: '', success: '' })
	const [profileSaved, setProfileSaved] = useState(false)
	const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmation: '' })
	const [passwordState, setPasswordState] = useState({ loading: false, error: '', success: '' })

	async function handleProfileSubmit(event) {
		event.preventDefault()
		setProfileSaved(false)
		setProfileState({ loading: true, error: '', success: '' })
		try {
			const response = token?.startsWith('mock-token')
				? await new Promise((resolve) => window.setTimeout(() => resolve({ user: { ...user, name: name.trim(), phone: phone.trim(), profile_picture: profilePicture, notification_preference: notificationPreference } }), 450))
				: await updateProfile({ name: name.trim(), phone: phone.trim(), notification_preference: notificationPreference })
			setAuth({ token, user: { ...response.user, profile_picture: profilePicture } })
			setProfileState({ loading: false, error: '', success: '' })
			setProfileSaved(true)
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
			if (token?.startsWith('mock-token')) {
				await new Promise((resolve) => window.setTimeout(resolve, 450))
			} else {
				await updatePassword(passwords)
			}
			setPasswords({ currentPassword: '', newPassword: '', confirmation: '' })
			setPasswordState({ loading: false, error: '', success: 'Password updated successfully.' })
		} catch (error) {
			setPasswordState({ loading: false, error: error.message, success: '' })
		}
	}

	return (
		<div className="settings-page">
			<div className="settings-heading">
				<div>
					<p className="settings-eyebrow">Account</p>
					<h2>Settings</h2>
					<p>Manage your profile, security, and remittance alerts.</p>
				</div>
			</div>

			<div className="settings-layout">
				<nav className="settings-tabs" aria-label="Settings sections">
					{sections.map(({ id, label, icon: Icon }, index) => (
						<a className={`settings-tab${index === 0 ? ' active' : ''}`} href={`#${id}`} key={id}>
							<Icon size={17} strokeWidth={1.8} />
							<span>{label}</span>
						</a>
					))}
				</nav>

				<div className="settings-panels">
					<section className="settings-panel" id="profile">
						<div className="settings-panel-heading">
							<div><h3>Profile details</h3><p>Keep your contact details up to date.</p></div>
						</div>
						<form onSubmit={handleProfileSubmit}>
							<label className="profile-picture-field">Profile picture<input type="file" accept="image/*" capture="user" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setProfilePicture(reader.result); reader.readAsDataURL(file) }} /></label>
							{profilePicture && <img className="profile-picture-preview" src={profilePicture} alt="Profile preview" />}
							<div className="settings-form-grid">
								<label>Name<input type="text" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} /></label>
								<label>Phone number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
							</div>
							<div className="settings-alerts" id="notifications">
								<div><h3>Remittance alerts</h3><p>Choose how you receive alerts about remittances and shortfalls.</p></div>
								<div className="settings-preferences" role="radiogroup" aria-label="Remittance alert preference">
									<label><input type="radio" name="notification-preference" value="none" checked={notificationPreference === 'none'} onChange={(event) => setNotificationPreference(event.target.value)} />No alerts</label>
									<label><input type="radio" name="notification-preference" value="sms" checked={notificationPreference === 'sms'} onChange={(event) => setNotificationPreference(event.target.value)} />SMS</label>
									<label><input type="radio" name="notification-preference" value="email" checked={notificationPreference === 'email'} onChange={(event) => setNotificationPreference(event.target.value)} />Email</label>
								</div>
							</div>
							{profileState.error && <p className="settings-error" role="alert">{profileState.error}</p>}
							{profileState.success && <p className="settings-success" role="status">{profileState.success}</p>}
							<button className="settings-primary" type="submit" disabled={profileState.loading}>{profileState.loading ? 'Saving...' : 'Save profile'}</button>
						</form>
						{profileSaved && <div className="settings-success-card" role="status"><strong>Profile saved</strong><span>Your profile details are up to date.</span></div>}
					</section>

					<section className="settings-panel" id="password">
						<h3>Change password</h3><p>Use a strong password you do not use elsewhere.</p>
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
					</section>

				</div>
			</div>
		</div>
	)
}