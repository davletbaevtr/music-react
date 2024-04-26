import {MAIN_ROUTE, ROOMS_ROUTE, RULES_ROUTE} from "../utils/consts";
import Main from "../pages/Main";
import Rooms from "../pages/Rooms";
import Rules from "../pages/Rules";
import Room from "../pages/Room";

export const routes = [
    {
        path: MAIN_ROUTE,
        page: Main,
        exact: true
    },
    {
        path: ROOMS_ROUTE,
        page: Rooms,
        exact: true
    },
    {
        path: RULES_ROUTE,
        page: Rules,
        exact: true
    },
    {
        path: '/rooms/:roomId',
        page: Room,
        exact: true
    },
]