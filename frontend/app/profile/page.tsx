"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { useFacebookAuth } from "../../hooks/useFacebookAuth";

function Modal({ open, onClose, title, value, onChange, onSave, type = "text", confirmValue = "", onConfirmChange = null, isDarkMode = false }) {
  if (!open) return null;
  
  const isPasswordModal = title === "Password Setup" || title === "Change Password";
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl p-10 w-full max-w-lg flex flex-col items-center">
        <div className="text-xl font-bold mb-4">{title}</div>
        
        {isPasswordModal ? (
          <div className="w-full space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {title === "Change Password" ? "New Password" : "Password"}
              </label>
              <input
                type="password"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmValue}
                onChange={e => onConfirmChange && onConfirmChange(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg"
              />
            </div>
            <div className="text-sm text-gray-600">
              Password must be at least 8 characters long.
            </div>
          </div>
        ) : title === "Phone Number" ? (
          <div className="w-full min-w-[400px]">
            <input
              type="tel"
              value={value}
              onChange={e => onChange(e.target.value)}
              name="phone"
              required={false}
              autoFocus={true}
              placeholder="Phone number"
              className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg mb-6"
            />
          </div>
        ) : (
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg mb-6"
          />
        )}
        
        <div className="flex gap-4 w-full justify-end mt-6">
          <button onClick={onClose} className={`px-5 py-2 rounded-lg font-semibold ${
          isDarkMode 
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}>Cancel</button>
          <button onClick={onSave} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            {isPasswordModal ? "Set Password" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { isGoogleReady, isLoading: isGoogleLoading, signInWithGoogle } = useGoogleAuth();
  const { isFacebookReady, isLoading: isFacebookLoading, signInWithFacebook } = useFacebookAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [phone, setPhone] = useState(""); // Placeholder for phone number
  const [loading, setLoading] = useState(true);
  const [authProvider, setAuthProvider] = useState("email"); // email, google, facebook
  const [linkingStatus, setLinkingStatus] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalField, setModalField] = useState("");
  const [modalValue, setModalValue] = useState("");
  const [modalConfirmValue, setModalConfirmValue] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem('email') || '';
      const storedPass = sessionStorage.getItem('password') || '';
      setEmail(storedEmail);
      setPassword(storedPass);
      
      // Detect auth provider based on password markers
      if (storedPass === "GOOGLE_OAUTH_USER_NO_PASSWORD") {
        setAuthProvider("google");
      } else if (storedPass === "FACEBOOK_OAUTH_USER_NO_PASSWORD") {
        setAuthProvider("facebook");
      } else {
        setAuthProvider("email");
      }
      if (!storedEmail || !storedPass) {
        router.push('/login');
        return;
      }
      
      // Dark mode is now handled by the context
      
      // Fetch profile from backend
      setLoading(true);
      
      // Use OAuth token for OAuth users, regular password for email users
      const apiPassword = (storedPass === "GOOGLE_OAUTH_USER_NO_PASSWORD" || storedPass === "FACEBOOK_OAUTH_USER_NO_PASSWORD") 
        ? "google_oauth_token" 
        : storedPass;
      
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail, password: apiPassword }),
      })
        .then(res => res.json())
        .then(data => {
          setDisplayName(data.display_name || "");
          setEmail(data.email || "");
          setUsername(data.username || "");
        })
        .catch(() => {
          // fallback or error handling
        })
        .finally(() => {
          setLoading(false);
        });

      // Load notification history from localStorage
      const currentUserEmail = sessionStorage.getItem('email');
      const clearedKey = currentUserEmail ? `clearedNotifications_${currentUserEmail}` : 'clearedNotifications';
      const storedCleared = localStorage.getItem(clearedKey);
      if (storedCleared) {
        try {
          setNotificationHistory(JSON.parse(storedCleared));
        } catch (e) {
          console.log('Error parsing notification history:', e);
        }
      }
    }
  }, [router]);

  // Handler for linking Google account
  const handleLinkGoogle = async () => {
    if (!isGoogleReady || isGoogleLoading || isLinking) {
      setLinkingStatus("⚠️ Google OAuth is loading. Please wait...");
      return;
    }

    setLinkingStatus("");
    setIsLinking(true);

    try {
      console.log("🔗 Starting Google account linking...");
      const result = await signInWithGoogle();
      console.log("🔗 Google linking result:", result);
      
      if (result && result.user_profile) {
        if (result.user_profile.linked_account) {
          setLinkingStatus("✅ Google account successfully linked! You can now sign in with Google or your existing password.");
        } else {
          setLinkingStatus("⚠️ This Google account is already associated with a different BlueBank account.");
        }
      } else {
        setLinkingStatus("❌ Failed to link Google account. Please try again.");
      }
    } catch (error) {
      console.error("🔗 Google linking error:", error);
      setLinkingStatus("❌ Failed to link Google account. Please try again.");
    } finally {
      setIsLinking(false);
      // Clear status after 5 seconds
      setTimeout(() => setLinkingStatus(""), 5000);
    }
  };

  // Handler for linking Facebook account
  const handleLinkFacebook = async () => {
    if (!isFacebookReady || isFacebookLoading || isLinking) {
      setLinkingStatus("⚠️ Facebook OAuth is loading. Please wait...");
      return;
    }

    setLinkingStatus("");
    setIsLinking(true);

    try {
      console.log("🔗 Starting Facebook account linking...");
      const result = await signInWithFacebook();
      console.log("🔗 Facebook linking result:", result);
      
      if (result && result.user_profile) {
        if (result.user_profile.linked_account) {
          setLinkingStatus("✅ Facebook account successfully linked! You can now sign in with Facebook or your existing password.");
        } else {
          setLinkingStatus("⚠️ This Facebook account is already associated with a different BlueBank account.");
        }
      } else {
        setLinkingStatus("❌ Failed to link Facebook account. Please try again.");
      }
    } catch (error) {
      console.error("🔗 Facebook linking error:", error);
      setLinkingStatus("❌ Failed to link Facebook account. Please try again.");
    } finally {
      setIsLinking(false);
      // Clear status after 5 seconds
      setTimeout(() => setLinkingStatus(""), 5000);
    }
  };

  // Handler for setting up password for OAuth users
  const handleSetupPassword = () => {
    setModalField("Password Setup");
    setModalValue("");
    setModalConfirmValue("");
    setModalOpen(true);
  };

  // Handler for changing password for email users
  const handleChangePassword = () => {
    setModalField("Change Password");
    setModalValue("");
    setModalConfirmValue("");
    setModalOpen(true);
  };

  // Handler for saving password changes
  const handlePasswordSave = async () => {
    if (modalValue.length < 8) {
      setLinkingStatus("❌ Password must be at least 8 characters long.");
      setTimeout(() => setLinkingStatus(""), 3000);
      return;
    }

    if (modalValue !== modalConfirmValue) {
      setLinkingStatus("❌ Passwords do not match. Please try again.");
      setTimeout(() => setLinkingStatus(""), 3000);
      return;
    }

    try {
      const endpoint = modalField === "Password Setup" ? "/api/setup-password" : "/api/change-password";
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: modalField === "Change Password" ? password : undefined,
          new_password: modalValue
        }),
      });

      if (response.ok) {
        setLinkingStatus("✅ Password updated successfully!");
        setModalOpen(false);
        setModalValue("");
        setModalConfirmValue("");
        
        // If this was setup for OAuth user, update the auth provider and session
        if (modalField === "Password Setup") {
          sessionStorage.setItem("password", modalValue);
          setPassword(modalValue);
          setAuthProvider("email");
        }
      } else {
        const errorData = await response.json();
        setLinkingStatus(`❌ ${errorData.detail || "Failed to update password"}`);
      }
    } catch (error) {
      console.error("Password update error:", error);
      setLinkingStatus("❌ Failed to update password. Please try again.");
    }

    setTimeout(() => setLinkingStatus(""), 5000);
  };

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePic(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return "";
    
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it's a +1 number (US, Canada, Caribbean - starts with 1 and has 10 digits)
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      const areaCode = cleaned.slice(1, 4);
      const prefix = cleaned.slice(4, 7);
      const lineNumber = cleaned.slice(7, 11);
      return `+1 (${areaCode}) ${prefix} ${lineNumber}`;
    }
    
    // For international numbers, use a more flexible approach
    if (cleaned.length >= 7) {
      // Extract country code (first 1-3 digits)
      let countryCode = "";
      let remainingDigits = cleaned;
      
      // Common country codes
      const countryCodes = [
        "1", "7", "20", "27", "30", "31", "32", "33", "34", "36", "39", "40", "41", "43", "44", "45", 
        "46", "47", "48", "49", "51", "52", "53", "54", "55", "56", "57", "58", "60", "61", "62", 
        "63", "64", "65", "66", "81", "82", "84", "86", "90", "91", "92", "93", "94", "95", "98"
      ];
      
      // Try to find the country code
      for (const code of countryCodes) {
        if (cleaned.startsWith(code)) {
          countryCode = code;
          remainingDigits = cleaned.slice(code.length);
          break;
        }
      }
      
      // If no country code found, assume it's a local number
      if (!countryCode) {
        remainingDigits = cleaned;
      }
      
      // Format the remaining digits based on length and country
      let formattedNumber = "";
      
      // Countries that use area codes with parentheses
      const areaCodeCountries = ["44", "49", "86", "81", "33", "34", "39", "41", "43", "45", "46", "47", "48"];
      
      if (areaCodeCountries.includes(countryCode)) {
        // Format with area code in parentheses (like +1)
        if (remainingDigits.length >= 6) {
          const areaCode = remainingDigits.slice(0, 2);
          const rest = remainingDigits.slice(2);
          if (rest.length <= 4) {
            formattedNumber = `(${areaCode}) ${rest}`;
          } else if (rest.length <= 7) {
            formattedNumber = `(${areaCode}) ${rest.slice(0, 3)} ${rest.slice(3)}`;
          } else {
            formattedNumber = `(${areaCode}) ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
          }
        } else {
          formattedNumber = remainingDigits;
        }
      } else {
        // Standard formatting for other countries
        if (remainingDigits.length <= 4) {
          formattedNumber = remainingDigits;
        } else if (remainingDigits.length <= 7) {
          formattedNumber = `${remainingDigits.slice(0, 3)} ${remainingDigits.slice(3)}`;
        } else if (remainingDigits.length <= 10) {
          formattedNumber = `${remainingDigits.slice(0, 3)} ${remainingDigits.slice(3, 6)} ${remainingDigits.slice(6)}`;
        } else {
          // For longer numbers, group by 3-4 digits
          const groups = [];
          let temp = remainingDigits;
          while (temp.length > 0) {
            if (temp.length > 4) {
              groups.push(temp.slice(0, 3));
              temp = temp.slice(3);
            } else {
              groups.push(temp);
              temp = "";
            }
          }
          formattedNumber = groups.join(" ");
        }
      }
      
      return countryCode ? `+${countryCode} ${formattedNumber}` : formattedNumber;
    }
    
    // Fallback for very short numbers
    return cleaned;
  };

  // Modal open handlers
  const openModal = (field: string, value: string) => {
    setModalField(field);
    setModalValue(value);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleModalSave = () => {
    // Placeholder: just update the local state for now
    if (modalField === "Display Name") setDisplayName(modalValue);
    if (modalField === "Username") setUsername(modalValue);
    if (modalField === "Email") setEmail(modalValue);
    if (modalField === "Phone Number") setPhone(modalValue);
    setModalOpen(false);
  };



  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-blue-950 via-gray-900 to-blue-950' 
        : 'bg-gradient-to-br from-blue-100 via-white to-blue-200'
    }`}>
      {/* Sidebar */}
      <aside className={`w-80 shadow-xl flex flex-col items-center py-12 px-8 min-h-screen transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'
      }`}>
        <div className={`text-3xl font-extrabold mb-10 tracking-tight ${
          isDarkMode ? 'text-blue-400' : 'text-blue-700'
        }`}>BlueBank</div>
        <nav className="w-full flex-1">
          <ul className="space-y-2">
            <li>
              <button 
                onClick={() => setActiveSection('general')}
                className={`w-full block px-4 py-3 rounded-xl font-semibold text-center transition-colors duration-200 ${
                  activeSection === 'general'
                    ? (isDarkMode 
                        ? 'bg-blue-900/50 text-blue-300' 
                        : 'bg-blue-100 text-blue-700')
                    : (isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-700')
                }`}
              >
                General
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('notification-history')}
                className={`w-full block px-4 py-3 rounded-xl font-semibold text-center transition-colors duration-200 ${
                  activeSection === 'notification-history'
                    ? (isDarkMode 
                        ? 'bg-blue-900/50 text-blue-300' 
                        : 'bg-blue-100 text-blue-700')
                    : (isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-700')
                }`}
              >
                Notification History
              </button>
            </li>
            {/* Add more menu items here in the future */}
          </ul>
        </nav>
        
        {/* Back Button - Part of sidebar navigation */}
        <div className="w-full mt-auto">
          <button
            onClick={() => router.push('/balance')}
            className={`w-full px-4 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Balance
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-20 px-12">
        {loading ? (
          <div className={`w-full max-w-3xl rounded-3xl shadow-xl p-14 flex flex-col items-center justify-center transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'
          }`}>
            <div className={`text-center ${
              isDarkMode ? 'text-blue-300' : 'text-blue-400'
            }`}>
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading profile...
              </div>
            </div>
          </div>
        ) : (
          <div className={`w-full max-w-3xl rounded-3xl shadow-xl p-14 flex flex-col items-center transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'
          }`}>
          {/* General Section */}
          {activeSection === 'general' && (
            <>
          {/* Profile Card */}
          <div className={`w-full rounded-2xl shadow p-8 mb-10 flex flex-col items-center relative transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-700' : 'bg-white'
          }`}>
            {/* Profile Banner (optional) */}
            {/* <div className="absolute top-0 left-0 w-full h-20 bg-blue-200 rounded-t-2xl" /> */}
            {/* Profile Picture */}
            <div className="relative mb-4 -mt-16">
              <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-blue-200">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-5xl text-blue-400">👤</span>
                )}
              </div>
              <button
                className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition"
                onClick={() => fileInputRef.current?.click()}
                title="Change profile picture"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z" /></svg>
              </button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handlePicChange}
              />
            </div>
            {/* Display Name */}
            <div className="w-full flex items-center mb-2">
              <div className={`font-semibold w-40 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Display Name</div>
              <div className={`flex-1 text-lg font-bold ${
                isDarkMode ? 'text-blue-400' : 'text-blue-700'
              }`}>{displayName}</div>
              <button onClick={() => openModal("Display Name", displayName)} className={`ml-4 px-4 py-1 rounded-lg font-medium text-sm transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-blue-900/50 hover:bg-blue-800/50 text-blue-300' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
              }`}>Edit</button>
            </div>
            {/* Username */}
            <div className="w-full flex items-center mb-2">
              <div className={`font-semibold w-40 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Username</div>
              <div className={`flex-1 text-lg ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{username}</div>
              <button onClick={() => openModal("Username", username)} className={`ml-4 px-4 py-1 rounded-lg font-medium text-sm transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-blue-900/50 hover:bg-blue-800/50 text-blue-300' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
              }`}>Edit</button>
            </div>
            {/* Email */}
            <div className="w-full flex items-center mb-2">
              <div className={`font-semibold w-40 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Email</div>
              <div className={`flex-1 text-lg ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{email}</div>
              <button onClick={() => openModal("Email", email)} className={`ml-4 px-4 py-1 rounded-lg font-medium text-sm transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-blue-900/50 hover:bg-blue-800/50 text-blue-300' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
              }`}>Edit</button>
            </div>
            {/* Phone Number */}
            <div className="w-full flex items-center mb-2">
              <div className={`font-semibold w-40 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Phone Number</div>
              <div className={`flex-1 text-lg ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{phone ? formatPhoneNumber(phone) : <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>You haven&apos;t added a phone number yet.</span>}</div>
              <button onClick={() => openModal("Phone Number", phone)} className={`ml-4 px-4 py-1 rounded-lg font-medium text-sm transition-colors duration-200 ${
                phone 
                  ? (isDarkMode ? 'bg-blue-900/50 hover:bg-blue-800/50 text-blue-300' : 'bg-blue-50 hover:bg-blue-100 text-blue-700')
                  : (isDarkMode ? 'bg-green-900/50 hover:bg-green-800/50 text-green-300' : 'bg-green-50 hover:bg-green-100 text-green-700')
              }`}>{phone ? 'Edit' : 'Add'}</button>
            </div>
          </div>

          {/* Password and Authentication Section */}
          <div className={`w-full rounded-2xl shadow p-8 flex flex-col gap-6 transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-700' : 'bg-white'
          }`}>
            <div className={`text-xl font-bold mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>Password and Authentication</div>
            
            {/* Current Authentication Method */}
            <div className={`p-4 rounded-xl ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-50'
            }`}>
              <div className={`text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Current Sign-In Method</div>
              <div className="flex items-center gap-3">
                {authProvider === "google" && (
                  <>
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Google Account</span>
                  </>
                )}
                {authProvider === "facebook" && (
                  <>
                    <div className="w-6 h-6 bg-[#1877F2] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Facebook Account</span>
                  </>
                )}
                {authProvider === "email" && (
                  <>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                    }`}>
                      <svg className={`w-4 h-4 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-600'
                      }`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Email & Password</span>
                  </>
                )}
              </div>
            </div>

            {/* Status message for account linking */}
            {linkingStatus && (
              <div className={`p-3 rounded-lg text-center ${
                linkingStatus.includes("✅") ? "bg-green-100 text-green-800" : 
                linkingStatus.includes("⚠️") ? "bg-yellow-100 text-yellow-800" : 
                "bg-red-100 text-red-800"
              }`}>
                {linkingStatus}
              </div>
            )}

            {/* OAuth users - Add Password Option */}
            {(authProvider === "google" || authProvider === "facebook") && (
              <div className={`p-4 rounded-xl border-2 border-dashed ${
                isDarkMode ? 'border-blue-600 bg-blue-900/10' : 'border-blue-300 bg-blue-50'
              }`}>
                <div className={`text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>Add Password Sign-In</div>
                <div className={`text-sm mb-3 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Set up a password so you can sign in with either {authProvider === "google" ? "Google" : "Facebook"} or email & password.</div>
                <button 
                  onClick={handleSetupPassword}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>Set Up Password</button>
              </div>
            )}

            {/* Email users - Add OAuth Options */}
            {authProvider === "email" && (
              <div className={`p-4 rounded-xl border-2 border-dashed ${
                isDarkMode ? 'border-green-600 bg-green-900/10' : 'border-green-300 bg-green-50'
              }`}>
                <div className={`text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`}>Link Social Accounts</div>
                <div className={`text-sm mb-3 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Connect Google or Facebook for faster sign-in options.</div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleLinkGoogle}
                    disabled={!isGoogleReady || isGoogleLoading || isLinking}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                  }`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isGoogleLoading ? "Loading..." : "Link Google"}
                  </button>
                  <button 
                    onClick={handleLinkFacebook}
                    disabled={!isFacebookReady || isFacebookLoading || isLinking}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode 
                      ? 'bg-[#1877F2] hover:bg-[#166FE5] text-white' 
                      : 'bg-[#1877F2] hover:bg-[#166FE5] text-white'
                  }`}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    {isFacebookLoading ? "Loading..." : "Link Facebook"}
                  </button>
                </div>
              </div>
            )}

            {/* Change Password (only for email users) */}
            {authProvider === "email" && (
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleChangePassword}
                  className={`px-5 py-2 rounded-lg font-semibold text-base transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>Change Password</button>
              </div>
            )}
            
            {/* Placeholders for future features */}
            <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Authenticator App, Security Keys, and Account Removal features coming soon.</div>
          </div>

          {/* Preferences Section */}
          <div className={`w-full rounded-2xl shadow p-8 flex flex-col gap-6 transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-700' : 'bg-white'
          }`}>
            <div className={`text-xl font-bold mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>Preferences</div>
            
            {/* Dark Mode Toggle */}
            <div className={`flex items-center justify-between p-4 rounded-xl transition-colors duration-200 ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-500' : 'bg-gray-200'
                }`}>
                  <svg className={`w-5 h-5 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div>
                  <div className={`font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>Dark Mode</div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Switch between light and dark themes</div>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
            </>
          )}

          {/* Notification History Section */}
          {activeSection === 'notification-history' && (
            <div id="notification-history" className={`w-full rounded-2xl shadow p-8 flex flex-col gap-6 transition-colors duration-200 ${
              isDarkMode ? 'bg-gray-700' : 'bg-white'
            }`}>
            <div className={`text-xl font-bold mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>Notification History</div>
            
            {notificationHistory.length === 0 ? (
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <div className="text-4xl mb-4">🔔</div>
                <p>No cleared notifications yet</p>
                <p className="text-sm mt-2">Notifications you clear will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {notificationHistory.map((notification, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-600 border-gray-500' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {notification}
                        </p>
                        <p className={`text-xs mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Cleared notification
                        </p>
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        📋
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {notificationHistory.length > 0 && (
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {notificationHistory.length} cleared notification{notificationHistory.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => {
                    const currentUserEmail = sessionStorage.getItem('email');
                    const clearedKey = currentUserEmail ? `clearedNotifications_${currentUserEmail}` : 'clearedNotifications';
                    localStorage.removeItem(clearedKey);
                    setNotificationHistory([]);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-red-700 hover:bg-red-600 text-white' 
                      : 'bg-red-100 hover:bg-red-200 text-red-700'
                  }`}
                >
                  Clear History
                </button>
              </div>
            )}
            </div>
          )}
        </div>
        )}
      </main>
      {/* Modal for editing fields */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={modalField}
        value={modalValue}
        onChange={setModalValue}
        onSave={modalField === "Password Setup" || modalField === "Change Password" ? handlePasswordSave : handleModalSave}
        type={modalField === "Email" ? "email" : modalField === "Phone Number" ? "tel" : "text"}
        confirmValue={modalConfirmValue}
        onConfirmChange={setModalConfirmValue}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
