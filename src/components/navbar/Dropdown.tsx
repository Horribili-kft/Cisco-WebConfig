import React from 'react'

export default function Dropdown() {
    return (
        <div className="form-control">
            <label className="label cursor-pointer">
                <span className="label-text">Remember me</span>
                <input type="checkbox" className="toggle" defaultChecked />
            </label>
        </div>
    )
}
