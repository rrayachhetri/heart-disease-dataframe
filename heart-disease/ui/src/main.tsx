import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './store';
import { loadCurrentUser } from './store/slices/authSlice';
import App from './App';
import './styles/global.less';
import 'react-toastify/dist/ReactToastify.css';

function Root() {
  useEffect(() => {
    // Restore session from stored token on first load
    store.dispatch(loadCurrentUser());
  }, []);

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
