const API_CONFIG = {
    DATA_COMPILER_BASE_URL: import.meta.env.VITE_DATA_COMPILER_URL || 'http://localhost:4001',
    DATA_API_BASE_URL: import.meta.env.VITE_DATA_API_URL || 'http://localhost:4000',
};

export default API_CONFIG;
