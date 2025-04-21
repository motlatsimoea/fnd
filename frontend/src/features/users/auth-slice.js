import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const initialState = {
    userInfo: {},
    loading: false,
    error: null,
};

export const login = createAsyncThunk('auth/login', async ({username, password}) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const { data } = await axios.post(
        '/login/', 
        { username: username, 'password': password },
        config
        );
    
    return data;
});

export const refreshToken = createAsyncThunk(
    'auth/refreshToken',
    async (_, { getState, dispatch }) => {
        try{
            const {
                userLogin: { userInfo },
            } = getState()

            const response = await axios.post('/token/refresh/', { 'refresh':userInfo.refresh } );
            const data = response.data;

            const updatedUserInfo = { ...userInfo, access: data.access };
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            return data.access;

        }catch (error) {
            dispatch(logout())
        }
    } 
    )

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.userInfo = null;
            state.loading = false;
            state.error = null;
            localStorage.removeItem('userInfo')
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) =>{
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) =>{
                state.loading = false;
                state.userInfo = action.payload;
                localStorage.setItem('userInfo', JSON.stringify(action.payload));
            })
            .addCase(login.rejected, (state, action) =>{
                state.loading = false;
                state.error = 
                    action.payload && action.payload.detail
                    ? action.payload.detail
                    : action.error.message;
                
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;