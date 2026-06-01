export const callParticipantSelect = {
  adminId: true,
  leftAt: true,
  admin: {
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  },
} as const;
