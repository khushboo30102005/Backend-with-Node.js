import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import heroImg from './assets/hero.png';
import './App.css';
import {
  GoogleLogin,
  useGoogleLogin,
  useGoogleOneTapLogin,
} from '@react-oauth/google';

function App() {
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => console.log(codeResponse),
    flow: 'auth-code',
  });
  /*   useGoogleOneTapLogin({
    onSuccess: (credentialResponse) => {
      console.log(credentialResponse);
    },
    onError: () => {
      console.log('Login Failed');
    },
  }); */
  return (
    <>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          console.log(credentialResponse);
        }}
        shape='pill'
        theme='filled_blue'
        text='continue_with'
        onError={() => {
          console.log('Login Failed');
        }}
        useOneTap
      />
      {/* <button onClick={() => login()}>Sign in with Google 🚀 </button> */}
    </>
  );
}

export default App;
