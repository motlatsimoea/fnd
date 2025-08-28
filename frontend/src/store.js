import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { thunk } from 'redux-thunk'
import authReducer from './features/users/auth-slice'
import registerReducer from './features/users/register-slice'
import profileReducer from './features/users/profile-slice'
import blogReducer from './features/blog/BlogList-slice'
import commentReducer from './features/blog/Comment-slice'
import productReducer from './features/products/Product-slice'
import reviewReducer from './features/products/review-slice'
import notificationReducer from './features/notifications/notice-slice'
import chatReducer from './features/chats/Chat-slice'

const reducer = combineReducers({
  auth: authReducer,
  BlogList: blogReducer,
  comments: commentReducer,
  register: registerReducer,
  profile: profileReducer,
  product: productReducer,
  reviews: reviewReducer,
  notifications: notificationReducer,
  chats: chatReducer,
})

const initialState = {
  auth: { userInfo: null },  // ✅ Don't preload from localStorage
}

export const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk),
  preloadedState: initialState,
  devTools: {
    name: 'frontend',
  },
})
