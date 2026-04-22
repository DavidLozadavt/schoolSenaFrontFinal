import React, { forwardRef, useImperativeHandle } from 'react'

export interface GCInstructorRef {
  validate: () => { isValid: boolean; errors: string[] }
}

const GCInstructor = forwardRef<GCInstructorRef>((_, ref) => {
  useImperativeHandle(ref, () => ({
    validate: () => ({ isValid: true, errors: [] }),
  }))

  return (
    <div>GCInstructor</div>
  )
})

GCInstructor.displayName = 'GCInstructor'

export default GCInstructor