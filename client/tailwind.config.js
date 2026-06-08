/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      sm: "480px",
      md: "768px",
      lg: "976px",
      xl: "1440px",
    },
    extend: {
      borderRadius: {
        custom: "40px",
        xl: "20px",
        full: "2000px",
        md: "15px",
      },
      fontSize: {
        13: "13px",
        14: "14px",
        18: "18px",
        20: "1.25rem",
        55: "55px",
        100: "100px",
        60: "60px",
        30: "30px",
        32: "32px",
        24: "1.531rem",
        36: "2.281rem",
        31: "31px",
      },
      fontFamily: {
        pop: ["Poppins"],
      },
      colors: {
        brand: {
          DEFAULT: "#CA133E",
          dark: "#A01030",
          light: "#FDE8EC",
        },
      },
      height: {
        248: "248px",
        685: "42.8rem",
        600: "37.5rem",
        1300: "1300px",
        185: "185px",
      },
      width: {
        30: "30%",
        45: "45%",
        49: "49%",
        55: "55%",
        200: "200px",
        320: "320px",
        95: "95%",
        90: "90%",
        20: "20%",
      },
      lineHeight: {
        90: "4.5rem",
        120: "110px",
        20: "1.30rem",
        55: "3.1rem",
        24: "1.4rem",
        36: "2.1rem",
        30: "30px",
        32: "32px",
        26: "26px",
      },
      spacing: {
        78: "335px",
        22: "5.3rem",
      },
      boxShadow: {
        custom: "0 30px 30px -20px rgba(133, 189, 215, 0.88)",
      },
    },
  },
  plugins: [],
};
