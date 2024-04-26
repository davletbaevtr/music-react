import React from 'react';
import {Link} from "react-router-dom";

const TextLink = ({to, text, sx}) => {
    return (
        <Link className={'textlink'} to={to} style={{...sx}}>
            {text}
        </Link>
    );
};

export default TextLink;