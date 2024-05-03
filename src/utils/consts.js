export const MAIN_ROUTE = '/'
export const API_URL = 'https://api.meloparty.ru'
export const WS_API_URL = 'wss://api.meloparty.ru:8001'

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