import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const GoogleLoginButton = () => {
  const { googleLogin } = useAuthStore()
  const navigate = useNavigate()

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential)
      
      const userData = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        googleId: decoded.sub
      }

      await googleLogin(userData, navigate)
      toast.success('Google login successful!')
    } catch (error) {
      console.error('Google login error:', error)
      toast.error('Google login failed')
    }
  }

  const handleGoogleError = () => {
    toast.error('Google login failed')
  }

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        theme="filled_black"
        size="large"
        width="100%"
        text="signin_with"
      />
    </div>
  )
}

export default GoogleLoginButton
