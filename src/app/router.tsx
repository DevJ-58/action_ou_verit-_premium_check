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
          { path: '*', element: <HomeScreen /> },
        ],
      },
    ],
  },
]
