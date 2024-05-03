export const MAIN_ROUTE = '/'
export const API_URL = 'https://82.97.250.84'
export const WS_API_URL = 'wss://82.97.250.84:8001'

export const ROOMS_ROUTE = '/rooms/'

export const RULES_ROUTE = '/rules/'
export const NavRoutes = [
    {
        path: MAIN_ROUTE,
        name: 'Главная',
    },
    {
        path: ROOMS_ROUTE,
        name: 'Комнаты',
    },
    {
        path:  RULES_ROUTE,
        name: 'Правила',
    }
]