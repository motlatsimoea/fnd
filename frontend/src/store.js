import { combineReducers, configureStore } from '@reduxjs/toolkit'
import thunk from 'redux-thunk'
import authReducer from './features/users/auth-slice'
import registerReducer from './features/users/register-slice'
import profileReducer from './features/users/profile-slice'
import blogReducer from './features/blog/BlogList-slice'
import commentReducer from './features/blog/Comment-slice'
import productReducer from './features/products/Product-slice'
import reviewReducer from './features/products/review-slice'
import notificationReducer from './features/notifications/notice-slice'


const reducer = combineReducers({
  userLogin: authReducer,
  BlogList: blogReducer,
  comments: commentReducer,
  register: registerReducer,
  profile: profileReducer,
  product: productReducer,
  reviews: reviewReducer,
  notifications: notificationReducer,

})

const UserInfoFromStorage = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null

const initialState = {
  userLogin: {userInfo: UserInfoFromStorage },
}

const middleware = [thunk]

export const store = configureStore({
  reducer,
  middleware,
  preloadedState: initialState,
  devTools: {
      name:"frontend",
  },

});
