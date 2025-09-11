"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { useFacebookAuth } from "../../hooks/useFacebookAuth";
import "flag-icons/css/flag-icons.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(() => {
    const defaultCountry = { code: "+1", flag: "us", name: "United States", abbr: "US", format: "(XXX) XXX-XXXX" };
    return defaultCountry;
  });
  const [phone, setPhone] = useState("");
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const { isGoogleReady, isLoading: isGoogleLoading, signInWithGoogle } = useGoogleAuth();
  const { isFacebookReady, isLoading: isFacebookLoading, signInWithFacebook, requiresHttps } = useFacebookAuth();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCountryDropdownOpen && !(event.target as Element).closest('.country-dropdown')) {
        setIsCountryDropdownOpen(false);
      }
      if (isMonthDropdownOpen && !(event.target as Element).closest('.month-dropdown')) {
        setIsMonthDropdownOpen(false);
      }
      if (isDayDropdownOpen && !(event.target as Element).closest('.day-dropdown')) {
        setIsDayDropdownOpen(false);
      }
      if (isYearDropdownOpen && !(event.target as Element).closest('.year-dropdown')) {
        setIsYearDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCountryDropdownOpen, isMonthDropdownOpen, isDayDropdownOpen, isYearDropdownOpen]);

  // Format phone number based on selected country
  const formatPhoneNumber = (value: string, country: { format?: string }) => {
    if (!country || !country.format) return value;

    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Apply country-specific formatting
    let formatted = '';
    let digitIndex = 0;
    
    for (let i = 0; i < country.format.length && digitIndex < digits.length; i++) {
      if (country.format[i] === 'X') {
        formatted += digits[digitIndex];
        digitIndex++;
      } else {
        formatted += country.format[i];
      }
    }
    
    return formatted;
  };

  // Handle phone number input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value, phoneCountry);
    setPhone(formatted);
    
    // Auto-detect country from area code for +1 countries
    if (value.length >= 4) { // Trigger as soon as area code is entered
      const detectedCountry = detectCountryFromAreaCode(value);
      if (detectedCountry && detectedCountry.abbr !== phoneCountry.abbr) {
        setPhoneCountry(detectedCountry);
      }
    }
  };

  // Reformat phone number when country changes
  useEffect(() => {
    if (phone) {
      const formatted = formatPhoneNumber(phone, phoneCountry);
      setPhone(formatted);
    }
  }, [phoneCountry]);

  // Auto-detect country from area code for +1 countries
  const detectCountryFromAreaCode = (phoneNumber: string) => {
    // Remove all non-digits to get just the numbers
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a +1 country (starts with 1)
    if (!digits.startsWith('1')) return null;
    
    // Extract area code (digits 2-4, which are positions 1-3 in the string)
    if (digits.length < 4) return null;
    const areaCode = digits.substring(1, 4);
    
    // Area code mappings for +1 countries
    const areaCodeMap: { [key: string]: string } = {
      // United States area codes
      '201': 'US', '202': 'US', '203': 'US', '205': 'US', '206': 'US', '207': 'US', '208': 'US', '209': 'US',
      '210': 'US', '212': 'US', '213': 'US', '214': 'US', '215': 'US', '216': 'US', '217': 'US', '218': 'US',
      '219': 'US', '220': 'US', '223': 'US', '224': 'US', '225': 'US', '228': 'US', '229': 'US', '231': 'US',
      '234': 'US', '239': 'US', '240': 'US', '248': 'US', '251': 'US', '252': 'US', '253': 'US', '254': 'US',
      '256': 'US', '260': 'US', '262': 'US', '267': 'US', '269': 'US', '270': 'US', '272': 'US', '276': 'US',
      '281': 'US', '301': 'US', '302': 'US', '303': 'US', '304': 'US', '305': 'US', '307': 'US', '308': 'US',
      '309': 'US', '310': 'US', '312': 'US', '313': 'US', '314': 'US', '315': 'US', '316': 'US', '317': 'US',
      '318': 'US', '319': 'US', '320': 'US', '321': 'US', '323': 'US', '325': 'US', '330': 'US', '331': 'US',
      '334': 'US', '336': 'US', '337': 'US', '339': 'US', '340': 'US', '341': 'US', '347': 'US', '351': 'US',
      '352': 'US', '360': 'US', '361': 'US', '364': 'US', '380': 'US', '385': 'US', '386': 'US', '401': 'US',
      '402': 'US', '404': 'US', '405': 'US', '406': 'US', '407': 'US', '408': 'US', '409': 'US', '410': 'US',
      '412': 'US', '413': 'US', '414': 'US', '415': 'US', '417': 'US', '419': 'US', '423': 'US', '424': 'US',
      '425': 'US', '430': 'US', '432': 'US', '434': 'US', '435': 'US', '440': 'US', '442': 'US', '443': 'US',
      '445': 'US', '447': 'US', '458': 'US', '463': 'US', '469': 'US', '470': 'US', '475': 'US', '478': 'US',
      '479': 'US', '480': 'US', '484': 'US', '501': 'US', '502': 'US', '503': 'US', '504': 'US', '505': 'US',
      '507': 'US', '508': 'US', '509': 'US', '510': 'US', '512': 'US', '513': 'US', '515': 'US', '516': 'US',
      '517': 'US', '518': 'US', '520': 'US', '530': 'US', '531': 'US', '534': 'US', '539': 'US', '540': 'US',
      '541': 'US', '551': 'US', '559': 'US', '561': 'US', '562': 'US', '563': 'US', '567': 'US', '570': 'US',
      '571': 'US', '573': 'US', '574': 'US', '575': 'US', '580': 'US', '585': 'US', '586': 'US', '601': 'US',
      '602': 'US', '603': 'US', '605': 'US', '606': 'US', '607': 'US', '608': 'US', '609': 'US', '610': 'US',
      '612': 'US', '614': 'US', '615': 'US', '616': 'US', '617': 'US', '618': 'US', '619': 'US', '620': 'US',
      '623': 'US', '626': 'US', '628': 'US', '629': 'US', '630': 'US', '631': 'US', '636': 'US', '641': 'US',
      '646': 'US', '650': 'US', '651': 'US', '657': 'US', '660': 'US', '661': 'US', '662': 'US', '667': 'US',
      '669': 'US', '678': 'US', '681': 'US', '682': 'US', '701': 'US', '702': 'US', '703': 'US', '704': 'US',
      '706': 'US', '707': 'US', '708': 'US', '712': 'US', '713': 'US', '714': 'US', '715': 'US', '716': 'US',
      '717': 'US', '718': 'US', '719': 'US', '720': 'US', '724': 'US', '725': 'US', '727': 'US', '731': 'US',
      '732': 'US', '734': 'US', '737': 'US', '740': 'US', '743': 'US', '747': 'US', '754': 'US', '757': 'US',
      '760': 'US', '762': 'US', '763': 'US', '765': 'US', '769': 'US', '770': 'US', '772': 'US', '773': 'US',
      '774': 'US', '775': 'US', '779': 'US', '781': 'US', '785': 'US', '786': 'US', '801': 'US', '802': 'US',
      '803': 'US', '804': 'US', '805': 'US', '806': 'US', '808': 'US', '810': 'US', '812': 'US', '813': 'US',
      '814': 'US', '815': 'US', '816': 'US', '817': 'US', '818': 'US', '828': 'US', '830': 'US', '831': 'US',
      '832': 'US', '843': 'US', '845': 'US', '847': 'US', '848': 'US', '850': 'US', '856': 'US', '857': 'US',
      '858': 'US', '859': 'US', '860': 'US', '862': 'US', '863': 'US', '864': 'US', '865': 'US', '870': 'US',
      '872': 'US', '878': 'US', '901': 'US', '903': 'US', '904': 'US', '906': 'US', '907': 'US', '908': 'US',
      '909': 'US', '910': 'US', '912': 'US', '913': 'US', '914': 'US', '915': 'US', '916': 'US', '917': 'US',
      '918': 'US', '919': 'US', '920': 'US', '925': 'US', '928': 'US', '929': 'US', '930': 'US', '931': 'US',
      '934': 'US', '936': 'US', '937': 'US', '938': 'US', '940': 'US', '941': 'US', '947': 'US', '949': 'US',
      '951': 'US', '952': 'US', '954': 'US', '956': 'US', '959': 'US', '970': 'US', '971': 'US', '972': 'US',
      '973': 'US', '975': 'US', '978': 'US', '979': 'US', '980': 'US', '984': 'US', '985': 'US', '989': 'US',
      
      // Canada area codes
      '204': 'CA', '226': 'CA', '236': 'CA', '249': 'CA', '250': 'CA', '289': 'CA', '306': 'CA', '343': 'CA',
      '354': 'CA', '365': 'CA', '367': 'CA', '368': 'CA', '403': 'CA', '416': 'CA', '418': 'CA', '431': 'CA',
      '437': 'CA', '438': 'CA', '450': 'CA', '506': 'CA', '514': 'CA', '519': 'CA', '548': 'CA', '579': 'CA',
      '581': 'CA', '587': 'CA', '604': 'CA', '613': 'CA', '639': 'US', '647': 'CA', '705': 'CA', '709': 'CA',
      '742': 'CA', '778': 'CA', '780': 'CA', '782': 'CA', '807': 'CA', '819': 'CA', '825': 'CA', '867': 'CA',
      '873': 'CA', '902': 'CA', '905': 'CA',
      
      // Dominican Republic area codes
      '809': 'DO', '829': 'DO', '849': 'DO',
      
      // Jamaica area codes
      '876': 'JM', '658': 'JM'
    };
    
    const countryAbbr = areaCodeMap[areaCode];
    if (countryAbbr) {
      return countries.find(c => c.abbr === countryAbbr);
    }
    
    return null;
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  const countries = [
    { code: "+93", flag: "af", name: "Afghanistan", abbr: "AF", format: "XX XXX XXXX" },
    { code: "+355", flag: "al", name: "Albania", abbr: "AL", format: "XX XXX XXX" },
    { code: "+213", flag: "dz", name: "Algeria", abbr: "DZ", format: "XX XXX XXX" },
    { code: "+376", flag: "ad", name: "Andorra", abbr: "AD", format: "XXX XXX" },
    { code: "+244", flag: "ao", name: "Angola", abbr: "AO", format: "XXX XXX XXX" },
    { code: "+54", flag: "ar", name: "Argentina", abbr: "AR", format: "(XXX) XXX-XXXX" },
    { code: "+374", flag: "am", name: "Armenia", abbr: "AM", format: "XX XXX XXX" },
    { code: "+61", flag: "au", name: "Australia", abbr: "AU", format: "XXXX XXX XXX" },
    { code: "+43", flag: "at", name: "Austria", abbr: "AT", format: "XXX XXX XXX" },
    { code: "+994", flag: "az", name: "Azerbaijan", abbr: "AZ", format: "XX XXX XX XX" },
    { code: "+973", flag: "bh", name: "Bahrain", abbr: "BH", format: "XXXX XXXX" },
    { code: "+880", flag: "bd", name: "Bangladesh", abbr: "BD", format: "XX XXX XXX" },
    { code: "+375", flag: "by", name: "Belarus", abbr: "BY", format: "XX XXX XX XX" },
    { code: "+32", flag: "be", name: "Belgium", abbr: "BE", format: "XXX XXX XXX" },
    { code: "+501", flag: "bz", name: "Belize", abbr: "BZ", format: "XXX XXXX" },
    { code: "+229", flag: "bj", name: "Benin", abbr: "BJ", format: "XX XXX XXX" },
    { code: "+975", flag: "bt", name: "Bhutan", abbr: "BT", format: "XX XXX XXX" },
    { code: "+591", flag: "bo", name: "Bolivia", abbr: "BO", format: "X XXX XXX" },
    { code: "+387", flag: "ba", name: "Bosnia and Herzegovina", abbr: "BA", format: "XX XXX XXX" },
    { code: "+267", flag: "bw", name: "Botswana", abbr: "BW", format: "XX XXX XXX" },
    { code: "+55", flag: "br", name: "Brazil", abbr: "BR", format: "(XX) XXXXX-XXXX" },
    { code: "+673", flag: "bn", name: "Brunei", abbr: "BN", format: "XXX XXXX" },
    { code: "+359", flag: "bg", name: "Bulgaria", abbr: "BG", format: "XX XXX XXX" },
    { code: "+226", flag: "bf", name: "Burkina Faso", abbr: "BF", format: "XX XXX XXX" },
    { code: "+257", flag: "bi", name: "Burundi", abbr: "BI", format: "XX XXX XXX" },
    { code: "+855", flag: "kh", name: "Cambodia", abbr: "KH", format: "XX XXX XXX" },
    { code: "+237", flag: "cm", name: "Cameroon", abbr: "CM", format: "XX XXX XXX" },
    { code: "+1", flag: "ca", name: "Canada", abbr: "CA", format: "(XXX) XXX-XXXX" },
    { code: "+238", flag: "cv", name: "Cape Verde", abbr: "CV", format: "XXX XXXX" },
    { code: "+236", flag: "cf", name: "Central African Republic", abbr: "CF", format: "XX XXX XXX" },
    { code: "+235", flag: "td", name: "Chad", abbr: "TD", format: "XX XXX XXX" },
    { code: "+56", flag: "cl", name: "Chile", abbr: "CL", format: "(XXX) XXX-XXXX" },
    { code: "+86", flag: "cn", name: "China", abbr: "CN", format: "XXX-XXXX-XXXX" },
    { code: "+57", flag: "co", name: "Colombia", abbr: "CO", format: "(XXX) XXX-XXXX" },
    { code: "+269", flag: "km", name: "Comoros", abbr: "KM", format: "XXX XXXX" },
    { code: "+242", flag: "cg", name: "Congo", abbr: "CG", format: "XX XXX XXX" },
    { code: "+506", flag: "cr", name: "Costa Rica", abbr: "CR", format: "XXXX XXXX" },
    { code: "+385", flag: "hr", name: "Croatia", abbr: "HR", format: "XX XXX XXX" },
    { code: "+53", flag: "cu", name: "Cuba", abbr: "CU", format: "X XXX XXXX" },
    { code: "+357", flag: "cy", name: "Cyprus", abbr: "CY", format: "XX XXX XXX" },
    { code: "+420", flag: "cz", name: "Czech Republic", abbr: "CZ", format: "XXX XXX XXX" },
    { code: "+45", flag: "dk", name: "Denmark", abbr: "DK", format: "XX XX XX XX" },
    { code: "+253", flag: "dj", name: "Djibouti", abbr: "DJ", format: "XX XXX XXX" },
    { code: "+1-809", flag: "do", name: "Dominican Republic", abbr: "DO", format: "(XXX) XXX-XXXX" },
    { code: "+593", flag: "ec", name: "Ecuador", abbr: "EC", format: "X XXX XXXX" },
    { code: "+20", flag: "eg", name: "Egypt", abbr: "EG", format: "XX XXX XXXX" },
    { code: "+503", flag: "sv", name: "El Salvador", abbr: "SV", format: "XXXX XXXX" },
    { code: "+240", flag: "gq", name: "Equatorial Guinea", abbr: "GQ", format: "XXX XXX XXX" },
    { code: "+291", flag: "er", name: "Eritrea", abbr: "ER", format: "X XXX XXX" },
    { code: "+372", flag: "ee", name: "Estonia", abbr: "EE", format: "XXX XXX XXX" },
    { code: "+251", flag: "et", name: "Ethiopia", abbr: "ET", format: "XX XXX XXX" },
    { code: "+679", flag: "fj", name: "Fiji", abbr: "FJ", format: "XXX XXXX" },
    { code: "+358", flag: "fi", name: "Finland", abbr: "FI", format: "XX XXX XXXX" },
    { code: "+33", flag: "fr", name: "France", abbr: "FR", format: "X XX XX XX XX" },
    { code: "+241", flag: "ga", name: "Gabon", abbr: "GA", format: "X XXX XXX" },
    { code: "+220", flag: "gm", name: "Gambia", abbr: "GM", format: "XXX XXXX" },
    { code: "+995", flag: "ge", name: "Georgia", abbr: "GE", format: "XXX XXX XXX" },
    { code: "+49", flag: "de", name: "Germany", abbr: "DE", format: "XXXX XXXXXX" },
    { code: "+233", flag: "gh", name: "Ghana", abbr: "GH", format: "XX XXX XXXX" },
    { code: "+30", flag: "gr", name: "Greece", abbr: "GR", format: "XXX XXX XXXX" },
    { code: "+502", flag: "gt", name: "Guatemala", abbr: "GT", format: "XXXX XXXX" },
    { code: "+224", flag: "gn", name: "Guinea", abbr: "GN", format: "XX XXX XXX" },
    { code: "+245", flag: "gw", name: "Guinea-Bissau", abbr: "GW", format: "XXX XXX" },
    { code: "+592", flag: "gy", name: "Guyana", abbr: "GY", format: "XXX XXXX" },
    { code: "+509", flag: "ht", name: "Haiti", abbr: "HT", format: "XX XX XXXX" },
    { code: "+504", flag: "hn", name: "Honduras", abbr: "HN", format: "XXXX XXXX" },
    { code: "+852", flag: "hk", name: "Hong Kong", abbr: "HK", format: "XXXX XXXX" },
    { code: "+36", flag: "hu", name: "Hungary", abbr: "HU", format: "XX XXX XXXX" },
    { code: "+354", flag: "is", name: "Iceland", abbr: "IS", format: "XXX XXXX" },
    { code: "+91", flag: "in", name: "India", abbr: "IN", format: "XXXXX-XXXXX" },
    { code: "+62", flag: "id", name: "Indonesia", abbr: "ID", format: "XX XXX XXX" },
    { code: "+98", flag: "ir", name: "Iran", abbr: "IR", format: "XX XXX XXXX" },
    { code: "+964", flag: "iq", name: "Iraq", abbr: "IQ", format: "XX XXX XXXX" },
    { code: "+353", flag: "ie", name: "Ireland", abbr: "IE", format: "XX XXX XXXX" },
    { code: "+972", flag: "il", name: "Israel", abbr: "IL", format: "XX XXX XXXX" },
    { code: "+39", flag: "it", name: "Italy", abbr: "IT", format: "XXX XXX XXXX" },
    { code: "+1-876", flag: "jm", name: "Jamaica", abbr: "JM", format: "(XXX) XXX-XXXX" },
    { code: "+81", flag: "jp", name: "Japan", abbr: "JP", format: "XX-XXXX-XXXX" },
    { code: "+962", flag: "jo", name: "Jordan", abbr: "JO", format: "XX XXX XXXX" },
    { code: "+7-6", flag: "kz", name: "Kazakhstan", abbr: "KZ", format: "XXX XXX XX XX" },
    { code: "+254", flag: "ke", name: "Kenya", abbr: "KE", format: "XX XXX XXXX" },
    { code: "+82", flag: "kr", name: "South Korea", abbr: "KR", format: "XX-XXXX-XXXX" },
    { code: "+965", flag: "kw", name: "Kuwait", abbr: "KW", format: "XXX XXX XXX" },
    { code: "+996", flag: "kg", name: "Kyrgyzstan", abbr: "KG", format: "XXX XXX XXX" },
    { code: "+856", flag: "la", name: "Laos", abbr: "LA", format: "XX XXX XXX" },
    { code: "+371", flag: "lv", name: "Latvia", abbr: "LV", format: "XX XXX XXX" },
    { code: "+961", flag: "lb", name: "Lebanon", abbr: "LB", format: "XX XXX XXX" },
    { code: "+231", flag: "lr", name: "Liberia", abbr: "LR", format: "XX XXX XXX" },
    { code: "+218", flag: "ly", name: "Libya", abbr: "LY", format: "XX XXX XXX" },
    { code: "+370", flag: "lt", name: "Lithuania", abbr: "LT", format: "XXX XXX XXX" },
    { code: "+352", flag: "lu", name: "Luxembourg", abbr: "LU", format: "XXX XXX XXX" },
    { code: "+853", flag: "mo", name: "Macau", abbr: "MO", format: "XXX XXX XXX" },
    { code: "+389", flag: "mk", name: "North Macedonia", abbr: "MK", format: "XX XXX XXX" },
    { code: "+261", flag: "md", name: "Madagascar", abbr: "MD", format: "XX XXX XXX" },
    { code: "+265", flag: "mw", name: "Malawi", abbr: "MW", format: "XX XXX XXX" },
    { code: "+60", flag: "my", name: "Malaysia", abbr: "MY", format: "XX-XXX XXXX" },
    { code: "+960", flag: "mv", name: "Maldives", abbr: "MV", format: "XXX XXXX" },
    { code: "+223", flag: "ml", name: "Mali", abbr: "ML", format: "XX XXX XXX" },
    { code: "+356", flag: "mt", name: "Malta", abbr: "MT", format: "XXXX XXXX" },
    { code: "+222", flag: "mr", name: "Mauritania", abbr: "MR", format: "XX XXX XXX" },
    { code: "+230", flag: "mu", name: "Mauritius", abbr: "MU", format: "XXX XXXX" },
    { code: "+52", flag: "mx", name: "Mexico", abbr: "MX", format: "(XXX) XXX-XXXX" },
    { code: "+373", flag: "md", name: "Moldova", abbr: "MD", format: "XX XXX XXX" },
    { code: "+377", flag: "mc", name: "Monaco", abbr: "MC", format: "XX XXX XXX" },
    { code: "+976", flag: "mn", name: "Mongolia", abbr: "MN", format: "XX XXX XXX" },
    { code: "+212", flag: "ma", name: "Morocco", abbr: "MA", format: "XX XXX XXXX" },
    { code: "+258", flag: "mz", name: "Mozambique", abbr: "MZ", format: "XX XXX XXX" },
    { code: "+95", flag: "mm", name: "Myanmar", abbr: "MM", format: "XX XXX XXX" },
    { code: "+264", flag: "na", name: "Namibia", abbr: "NA", format: "XX XXX XXXX" },
    { code: "+977", flag: "np", name: "Nepal", abbr: "NP", format: "XX XXX XXX" },
    { code: "+31", flag: "nl", name: "Netherlands", abbr: "NL", format: "X XXX XXXX" },
    { code: "+64", flag: "nz", name: "New Zealand", abbr: "NZ", format: "XX XXX XXXX" },
    { code: "+505", flag: "ni", name: "Nicaragua", abbr: "NI", format: "XXXX XXXX" },
    { code: "+227", flag: "ne", name: "Niger", abbr: "NE", format: "XX XXX XXX" },
    { code: "+234", flag: "ng", name: "Nigeria", abbr: "NG", format: "XX XXX XXXX" },
    { code: "+47", flag: "no", name: "Norway", abbr: "NO", format: "XXX XX XXX" },
    { code: "+968", flag: "om", name: "Oman", abbr: "OM", format: "XX XXX XXX" },
    { code: "+92", flag: "pk", name: "Pakistan", abbr: "PK", format: "XXX XXX XXXX" },
    { code: "+970", flag: "ps", name: "Palestine", abbr: "PS", format: "XX XXX XXXX" },
    { code: "+507", flag: "pa", name: "Panama", abbr: "PA", format: "XXXX XXXX" },
    { code: "+675", flag: "pg", name: "Papua New Guinea", abbr: "PG", format: "XXX XXX" },
    { code: "+595", flag: "py", name: "Paraguay", abbr: "PY", format: "XXX XXX XXX" },
    { code: "+51", flag: "pe", name: "Peru", abbr: "PE", format: "XXX XXX XXX" },
    { code: "+63", flag: "ph", name: "Philippines", abbr: "PH", format: "XXX XXX XXXX" },
    { code: "+48", flag: "pl", name: "Poland", abbr: "PL", format: "XXX XXX XXX" },
    { code: "+351", flag: "pt", name: "Portugal", abbr: "PT", format: "XXX XXX XXX" },
    { code: "+974", flag: "qa", name: "Qatar", abbr: "QA", format: "XXX XXX XXX" },
    { code: "+40", flag: "ro", name: "Romania", abbr: "RO", format: "XX XXX XXX" },
    { code: "+7", flag: "ru", name: "Russia", abbr: "RU", format: "(XXX) XXX-XX-XX" },
    { code: "+250", flag: "rw", name: "Rwanda", abbr: "RW", format: "XX XXX XXX" },
    { code: "+966", flag: "sa", name: "Saudi Arabia", abbr: "SA", format: "XX XXX XXXX" },
    { code: "+221", flag: "sn", name: "Senegal", abbr: "SN", format: "XX XXX XXX" },
    { code: "+381", flag: "rs", name: "Serbia", abbr: "RS", format: "XX XXX XXX" },
    { code: "+65", flag: "sg", name: "Singapore", abbr: "SG", format: "XXXX XXXX" },
    { code: "+421", flag: "sk", name: "Slovakia", abbr: "SK", format: "XXX XXX XXX" },
    { code: "+386", flag: "si", name: "Slovenia", abbr: "SI", format: "XX XXX XXX" },
    { code: "+27", flag: "za", name: "South Africa", abbr: "ZA", format: "XX XXX XXXX" },
    { code: "+34", flag: "es", name: "Spain", abbr: "ES", format: "XXX XXX XXX" },
    { code: "+94", flag: "lk", name: "Sri Lanka", abbr: "LK", format: "XX XXX XXXX" },
    { code: "+249", flag: "sd", name: "Sudan", abbr: "SD", format: "XX XXX XXX" },
    { code: "+46", flag: "se", name: "Sweden", abbr: "SE", format: "XX XXX XXXX" },
    { code: "+41", flag: "ch", name: "Switzerland", abbr: "CH", format: "XX XXX XXXX" },
    { code: "+963", flag: "sy", name: "Syria", abbr: "SY", format: "XX XXX XXX" },
    { code: "+886", flag: "tw", name: "Taiwan", abbr: "TW", format: "XX XXX XXXX" },
    { code: "+992", flag: "tj", name: "Tajikistan", abbr: "TJ", format: "XXX XXX XXX" },
    { code: "+255", flag: "tz", name: "Tanzania", abbr: "TZ", format: "XX XXX XXXX" },
    { code: "+66", flag: "th", name: "Thailand", abbr: "TH", format: "X XXX XXXX" },
    { code: "+216", flag: "tn", name: "Tunisia", abbr: "TN", format: "XX XXX XXX" },
    { code: "+90", flag: "tr", name: "Turkey", abbr: "TR", format: "XXX XXX XXXX" },
    { code: "+380", flag: "ua", name: "Ukraine", abbr: "UA", format: "XX XXX XX XX" },
    { code: "+971", flag: "ae", name: "United Arab Emirates", abbr: "AE", format: "XX XXX XXXX" },
    { code: "+44", flag: "gb", name: "United Kingdom", abbr: "UK", format: "XXXX XXXXXX" },
    { code: "+1", flag: "us", name: "United States", abbr: "US", format: "(XXX) XXX-XXXX" },
    { code: "+598", flag: "uy", name: "Uruguay", abbr: "UY", format: "XX XXX XXX" },
    { code: "+998", flag: "uz", name: "Uzbekistan", abbr: "UZ", format: "XX XXX XX XX" },
    { code: "+58", flag: "ve", name: "Venezuela", abbr: "VE", format: "(XXX) XXX-XXXX" },
    { code: "+84", flag: "vn", name: "Vietnam", abbr: "VN", format: "XX XXX XXXX" },
    { code: "+967", flag: "ye", name: "Yemen", abbr: "YE", format: "XX XXX XXX" },
    { code: "+260", flag: "zm", name: "Zambia", abbr: "ZM", format: "XX XXX XXX" },
    { code: "+263", flag: "zw", name: "Zimbabwe", abbr: "ZW", format: "XX XXX XXX" }
  ];

  // Filter countries based on search
  const filteredCountries = countries
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(country =>
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.abbr.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.code.includes(countrySearch)
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");



    if (!email || !displayName || !username || !password || !dobMonth || !dobDay || !dobYear) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          display_name: displayName,
          username,
          password,
          dob_month: dobMonth,
          dob_day: dobDay,
          dob_year: dobYear,
          phone: phoneCountry.code + phone
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store credentials in sessionStorage for automatic login
        sessionStorage.setItem("email", email);
        sessionStorage.setItem("password", password);
        // Also store user data in localStorage for other components
        localStorage.setItem("user", JSON.stringify(data));
        setError("✅ Registration successful! Redirecting to your account...");
        setTimeout(() => router.push("/balance"), 1000);
      } else {
        const data = await response.json();
        setError(data.detail || "Registration failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    console.log("🚨 BUTTON CLICKED - IMMEDIATE LOG 🚨");
    console.log("🔵 Google Sign Up button clicked!");
    console.log("🔵 isGoogleReady:", isGoogleReady);
    console.log("🔵 isGoogleLoading:", isGoogleLoading);
    console.log("🔵 signInWithGoogle function:", typeof signInWithGoogle);
    
    if (!isGoogleReady || isGoogleLoading) {
      console.log("🔴 Google OAuth not ready, showing error");
      setError("Google OAuth is loading. Please wait...");
      return;
    }

    console.log("🔵 Starting Google OAuth flow...");
    setError("");
    setIsLoading(true);

    try {
      console.log("🔵 About to call signInWithGoogle...");
      const result = await signInWithGoogle();
      console.log("🔵 signInWithGoogle returned result:", result);
      
      if (result && result.user_profile) {
        console.log("Google OAuth successful, storing user data:", result.user_profile);
        
        // Store user credentials for session
        sessionStorage.setItem("email", result.user_profile.email);
        sessionStorage.setItem("password", "GOOGLE_OAUTH_USER_NO_PASSWORD"); // Special marker for OAuth users
        
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(result));
        
        // Show success message
        setError(`✅ ${result.message} Redirecting to your account...`);
        console.log("Redirecting to balance page in 2 seconds...");
        setTimeout(() => {
          console.log("Executing redirect to /balance");
          router.push("/balance");
        }, 2000);
      } else {
        console.error("Google OAuth failed - no result or user_profile:", result);
        setError("Google sign-up failed. Please try again.");
      }
    } catch (error) {
      console.error("🔴 Google sign-up error:", error);
      console.error("🔴 Error details:", error.message, error.stack);
      setError("Google sign-up failed. Please try again.");
    } finally {
      console.log("🔵 Resetting loading state");
      setIsLoading(false);
    }
  };

  const handleFacebookSignUp = async () => {
    // Check if Facebook requires HTTPS
    if (requiresHttps) {
      setError("🔒 Facebook OAuth requires HTTPS. Please access the site using HTTPS to use Facebook signup.");
      return;
    }

    if (!isFacebookReady || isFacebookLoading) {
      setError("⚠️ Facebook OAuth is loading. Please wait...");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await signInWithFacebook();
      console.log("Facebook OAuth result:", result);
      
      if (result && result.user_profile) {
        console.log("Facebook OAuth successful, storing user data:", result.user_profile);
        
        // Store user credentials for session
        sessionStorage.setItem("email", result.user_profile.email);
        sessionStorage.setItem("password", "FACEBOOK_OAUTH_USER_NO_PASSWORD"); // Special marker for OAuth users
        
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(result));
        
        setError(`✅ ${result.message} Redirecting to your account...`);
        console.log("Redirecting to balance page in 2 seconds...");
      setTimeout(() => {
          console.log("Executing redirect to /balance");
          router.push("/balance");
        }, 2000);
      } else {
        console.error("Facebook OAuth failed - no result or user_profile:", result);
        setError("❌ Facebook sign-up failed. Please try again.");
      }
    } catch (error) {
      console.error("Facebook sign-up error:", error);
      setError("❌ Facebook sign-up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-100 via-white to-blue-200'
    }`}>
      <div className={`max-w-2xl w-full space-y-8 ${
        isDarkMode 
          ? 'bg-gray-800/90 shadow-xl rounded-3xl px-12 py-16' 
          : 'bg-white/90 shadow-xl rounded-3xl px-12 py-16'
      }`}>
        <div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`}>
            Create an account
          </h2>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-4">
          {/* Debug info */}
          <div style={{fontSize: '12px', color: 'red', padding: '5px'}}>
            Debug: isGoogleReady={String(isGoogleReady)}, isGoogleLoading={String(isGoogleLoading)}, isLoading={String(isLoading)}, disabled={String(!isGoogleReady || isGoogleLoading || isLoading)}
          </div>
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={!isGoogleReady || isGoogleLoading || isLoading}
            className={`w-full flex justify-center items-center px-4 py-4 border border-blue-300 rounded-xl shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode 
                ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
            }`}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isGoogleLoading ? "Loading Google..." : "Sign up with Google"}
          </button>

          <button
            type="button"
            onClick={handleFacebookSignUp}
            disabled={!isFacebookReady || isFacebookLoading || isLoading || requiresHttps}
            className={`w-full flex justify-center items-center px-4 py-4 border border-blue-300 rounded-xl shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode 
                ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {requiresHttps ? "🔒 Requires HTTPS" : isFacebookLoading ? "Loading Facebook..." : "Sign up with Facebook"}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`} />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={`px-2 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
              Or continue with
            </span>
          </div>
        </div>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* EMAIL */}
            <div>
              <label htmlFor="email" className={`block text-base font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-2 block w-full px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                    : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                }`}
              />
            </div>

            {/* DISPLAY NAME */}
            <div>
              <label htmlFor="displayName" className={`block text-base font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Display name <span className="text-red-500">*</span>
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                autoComplete="name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`mt-2 block w-full px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                    : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                }`}
              />
            </div>

            {/* USERNAME */}
            <div>
              <label htmlFor="username" className={`block text-base font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`mt-2 block w-full px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                    : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                }`}
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label htmlFor="password" className={`block text-base font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-2 block w-full px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                    : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                }`}
              />
            </div>

            {/* DATE OF BIRTH */}
            <div>
              <label className={`block text-base font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Date of birth <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 flex gap-3">
                {/* Month Dropdown */}
                <div className="flex-1 relative month-dropdown">
                  <button
                    type="button"
                    onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                    className={`w-full px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 text-left flex items-center justify-between ${
                      isDarkMode 
                        ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                        : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                    }`}
                  >
                    <span>{dobMonth || "Month"}</span>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isMonthDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                      {months.map((month) => (
                        <button
                          key={month}
                          type="button"
                          onClick={() => {
                            setDobMonth(month);
                            setIsMonthDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center ${
                            dobMonth === month ? 'bg-blue-100' : ''
                          }`}
                        >
                          <span className="font-medium">{month}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Day Dropdown */}
                <div className="flex-1 relative day-dropdown">
                  <button
                    type="button"
                    onClick={() => setIsDayDropdownOpen(!isDayDropdownOpen)}
                    className={`w-full px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 text-left flex items-center justify-between ${
                      isDarkMode 
                        ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                        : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                    }`}
                  >
                    <span>{dobDay || "Day"}</span>
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isDayDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                      {days.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setDobDay(day.toString());
                            setIsDayDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center ${
                            dobDay === day.toString() ? 'bg-blue-100' : ''
                          }`}
                        >
                          <span className="font-medium">{day}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Year Dropdown */}
                <div className="flex-1 relative year-dropdown">
                  <button
                    type="button"
                    onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                    className={`w-full px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 text-left flex items-center justify-between ${
                      isDarkMode 
                        ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                        : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                    }`}
                  >
                    <span>{dobYear || "Year"}</span>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isYearDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                      {years.map((year) => (
                        <button
                          key={year}
                          type="button"
                          onClick={() => {
                            setDobYear(year.toString());
                            setIsYearDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center ${
                            dobYear === year.toString() ? 'bg-blue-100' : ''
                          }`}
                        >
                          <span className="font-medium">{year}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Phone Number (Optional) */}
            <div>
              <label className={`block text-base font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Phone number (Optional)
              </label>
              <div className="mt-2 flex gap-3">
                <div className="flex flex-col">
                  <div className="relative country-dropdown">
                    <button
                      type="button"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className={`w-full px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 text-left flex items-center gap-3 ${
                        isDarkMode 
                          ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                          : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                      }`}
                    >
                      <span className={`fi fi-${phoneCountry.flag || 'us'} text-xl`}></span>
                      <span>{phoneCountry.abbr || 'US'}</span>
                      <span className="text-gray-500">({phoneCountry.code || '+1'})</span>
                      <svg className="ml-auto h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isCountryDropdownOpen && (
                      <div className="absolute z-10 w-96 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60">
                        {/* Search Input - Always Visible */}
                        <div className="bg-white p-3 border-b border-gray-200 rounded-t-lg">
                          <input
                            type="text"
                            placeholder="Search countries..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {/* Countries List - Scrollable */}
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                          {filteredCountries.map((country) => (
                            <button
                              key={`${country.code}-${country.flag}`}
                              type="button"
                                                          onClick={() => {
                              setPhoneCountry(country);
                              setIsCountryDropdownOpen(false);
                              setCountrySearch("");
                            }}
                                                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-4 ${
                              phoneCountry.code === country.code ? 'bg-blue-100' : ''
                            }`}
                            >
                              <span className={`fi fi-${country.flag} text-2xl flex-shrink-0`}></span>
                              <span className="font-medium flex-1">{country.name}</span>
                              <span className="text-gray-500 flex-shrink-0">({country.code})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder={phoneCountry.format || "Phone number"}
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`flex-1 px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 ${
                    isDarkMode 
                      ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                      : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                  }`}
                />
              </div>
            </div>

            {/* Email Opt-in Checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="emailOptIn"
                  name="emailOptIn"
                  type="checkbox"
                  checked={emailOptIn}
                  onChange={(e) => setEmailOptIn(e.target.checked)}
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="emailOptIn" className={`${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  (Optional) It&apos;s okay to send me emails with BlueBank updates, tips, and special offers. You can opt out at any time.
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 border border-blue-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode 
                  ? 'border-blue-400 bg-blue-600 text-white hover:bg-blue-700' 
                  : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          <div className="text-center">
            <Link 
              href="/login" 
              className={`font-medium ${
                isDarkMode 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-500'
              }`}
            >
              Already have an account? Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
