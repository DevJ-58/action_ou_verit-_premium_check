import type { RouteObject } from 'react-router'
import { AgeGateScreen } from '@/features/onboarding/AgeGateScreen'
import { HomeScreen } from '@/features/home/HomeScreen'
import { MyDaresScreen } from '@/features/dares/MyDaresScreen'
import { PlayersScreen } from '@/features/players/PlayersScreen'
import { ProfileScreen } from '@/features/profile/ProfileScreen'
import { RequireAge } from './RequireAge'
import { RootErrorScreen } from './RootErrorScreen'
import { RootLayout } from './RootLayout'
import { TabsLayout } from './TabsLayout'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RootErrorScreen />,
    children: [
      { path: '/bienvenue', element: <AgeGateScreen /> },
      {
        element: <RequireAge />,
        children: [
          {
            element: <TabsLayout />,
            children: [
              { index: true, element: <HomeScreen /> },
              { path: 'joueurs', element: <PlayersScreen /> },
              { path: 'defis', element: <MyDaresScreen /> },
              { path: 'profil', element: <ProfileScreen /> },
            ],
          },
          {
            path: 'joueurs/:playerId',
            lazy: async () => ({
              Component: (await import('@/features/players/PlayerEditorScreen')).PlayerEditorScreen,
            }),
          },
          {
            path: 'partie/nouvelle',
            lazy: async () => ({
              Component: (await import('@/features/game-setup/SetupScreen')).SetupScreen,
            }),
          },
          {
            path: 'partie',
            lazy: async () => ({
              Component: (await import('@/features/game/GameScreen')).GameScreen,
            }),
          },
          {
            path: 'partie/recap',
            lazy: async () => ({
              Component: (await import('@/features/game/RecapScreen')).RecapScreen,
            }),
          },
          {
            lazy: async () => ({
              Component: (await import('@/features/account/RequireAccount')).RequireAccount,
            }),
            children: [
              {
                path: 'salon/nouveau',
                lazy: async () => ({
                  Component: (await import('@/features/room/CreateRoomScreen')).CreateRoomScreen,
                }),
              },
              {
                path: 'salon/rejoindre',
                lazy: async () => ({
                  Component: (await import('@/features/room/JoinRoomScreen')).JoinRoomScreen,
                }),
              },
              {
                path: 'salon/:code',
                lazy: async () => ({
                  Component: (await import('@/features/room/RoomScreen')).RoomScreen,
                }),
              },
            ],
          },
          {
            path: 'premium',
            lazy: async () => ({
              Component: (await import('@/features/premium/PremiumScreen')).PremiumScreen,
            }),
          },
          {
            path: 'premium/merci',
            lazy: async () => ({
              Component: (await import('@/features/premium/PremiumThanksScreen'))
                .PremiumThanksScreen,
            }),
          },
          {
            path: 'reglages',
            lazy: async () => ({
              Component: (await import('@/features/settings/SettingsScreen')).SettingsScreen,
            }),
          },
          {
            path: 'compte',
            lazy: async () => ({
              Component: (await import('@/features/account/AuthScreen')).AuthScreen,
            }),
          },
          { path: '*', element: <HomeScreen /> },
        ],
      },
    ],
  },
]
