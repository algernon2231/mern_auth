import React from 'react'
import { useState } from 'react'
import axios from 'axios'
import jwt_decode from 'jwt-decode'

const baseURL = "http://localhost:5000/api";

const App = () => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json"
    }
  });
  instance.interceptors.request.use(async (config) => {
    // console.log('truoc khi response::')
    if (config.url.indexOf('/login') >= 0 || config.url.indexOf('/refresh') >= 0) {
      return config;
    }
    if (user && user.accessToken) {
      let currentDate = new Date();
      const decodedToken = jwt_decode(user.accessToken);
      if (decodedToken.exp * 1000 < currentDate.getTime()) {
        try {
          const data = await refreshToken();
          config.headers['authorization'] = "Bearer " + data.accessToken;
        } catch (error) {
          return Promise.reject(error);
        }
      }
    }
    return config

  }, err => {
    return Promise.reject(err)
  })

  instance.interceptors.response.use(async config => {
    // console.log('Sau khi response::')
    return config
  }, err => {
    return Promise.reject(err)
  })
  const refreshToken = async () => {
    try {
      const res = await instance.post(`${baseURL}/refresh`, { token: user.refreshToken }, {
        headers: {
          "Content-Type": "application/json",
        }
      });
      setUser(prevUser => ({ ...prevUser, accessToken: res.data.accessToken, refreshToken: res.data.refreshToken }));
      return res.data;
    } catch (err) {
      throw err;
    }
  }

  const logout = () => {
    setUser(null);
    setSuccess(false);
    setError(false);
  }
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await instance.post(`${baseURL}/login`, { username, password }, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        }
      })
      setUser(await res.data);
    } catch (error) {
      console.log(error);
    }
  }
  const handleDelete = async id => {
    setSuccess(false);
    setError(false);
    try {
      await instance.delete(`${baseURL}/users/${id}`, {
        headers: { Authorization: `Bearer ${user?.accessToken} ` }
      });
      setSuccess(true);
    } catch (err) {
      setError(true)
    }
  }
  return (
    <div className="container">
      {user ? (
        <div className="home">
          <span>
            Welcome to the <b>{user.isAdmin ? "admin" : "user"}</b> dashboard{" "}
            <b>{user.username}</b>.
          </span>
          <span>Delete Users:</span>
          <button className="deleteButton" onClick={() => handleDelete(1)}>
            Delete John
          </button>
          <button className="deleteButton" onClick={() => handleDelete(2)}>
            Delete Jane
          </button>
          {error && (
            <span className="error">
              You are not allowed to delete this user!
            </span>
          )}
          {success && (
            <span className="success">
              User has been deleted successfully...
            </span>
          )}
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div className='login'>
          <form onSubmit={handleSubmit}>
            <span className="formTitle">Login</span>
            <input type="text"
              placeholder='username'
              onChange={e => setUsername(e.target.value)}
            />
            <input type="password"
              placeholder='password'
              onChange={e => setPassword(e.target.value)}
            />
            <button type='submit' className='submitButton'>Login</button>
          </form >
        </div >
      )}
    </div>

  )
}

export default App