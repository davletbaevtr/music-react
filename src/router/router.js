import React, {useContext, useEffect} from 'react';
import {Routes, Route, Navigate} from "react-router-dom";
import {routes} from "./routes";
import {MAIN_ROUTE} from "../utils/consts";
import {observer} from "mobx-react-lite";
import {Context} from "../index";

const Router = () => {
    return (
            <Routes>
                {routes.map(route =>
                    <Route
                        path={route.path}
                        element={<route.page/>}
                        key={route.path}
                    />
                )}
                <Route path="*" element={<Navigate to={MAIN_ROUTE}/>}/>
            </Routes>
    );
};

export default observer(Router);
