'use client'

import React from "react"

export default function Page() {
  // here we will push the user to the profile page on mount
  React.useEffect(() => {
    window.location.href = "/user/profile";
  }, []);
  return (
    <></>
  )
}
