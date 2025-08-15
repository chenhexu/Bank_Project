"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "../../contexts/DarkModeContext";

function Modal({ open, onClose, title, value, onChange, onSave, type = "text" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl p-10 w-full max-w-lg flex flex-col items-center">
        <div className="text-xl font-bold mb-4">Edit {title}</div>
        {title === "Phone Number" ? (
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
          <button onClick={onClose} className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold">Cancel</button>
          <button onClick={onSave} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [phone, setPhone] = useState(""); // Placeholder for phone number
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalField, setModalField] = useState("");
  const [modalValue, setModalValue] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem('email') || '';
      const storedPass = sessionStorage.getItem('password') || '';
      setEmail(storedEmail);
      setPassword(storedPass);
      if (!storedEmail || !storedPass) {
        router.push('/login');
        return;
      }
      
      // Dark mode is now handled by the context
      
      // Fetch profile from backend
              fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail, password: storedPass }),
      })
        .then(res => res.json())
        .then(data => {
          setDisplayName(data.display_name || "");
          setEmail(data.email || "");
          setUsername(data.username || "");
        })
        .catch(() => {
          // fallback or error handling
        });
    }
  }, [router]);

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

  // Masked email for display
  const maskedEmail = email.replace(/(.{2}).+(@.+)/, (_, a, b) => a + "********" + b);

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
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
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
              <a href="#" className={`block px-4 py-3 rounded-xl font-semibold text-center transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-blue-900/50 text-blue-300' 
                  : 'bg-blue-100 text-blue-700'
              }`}>General</a>
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
        <div className={`w-full max-w-3xl rounded-3xl shadow-xl p-14 flex flex-col items-center transition-colors duration-200 ${
          isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'
        }`}>
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
              }`}>{phone ? formatPhoneNumber(phone) : <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>You haven't added a phone number yet.</span>}</div>
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
            <div className="flex items-center gap-4 mb-2">
              <button className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base">Change Password</button>
            </div>
            
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
        </div>
      </main>
      {/* Modal for editing fields */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={modalField}
        value={modalValue}
        onChange={setModalValue}
        onSave={handleModalSave}
        type={modalField === "Email" ? "email" : modalField === "Phone Number" ? "tel" : "text"}
      />
    </div>
  );
}
