import type { RouteObject } from 'react-router'
import { AgeGateScreen } from '@/features/onboarding/AgeGateScreen'
import { HomeScreen } from '@/features/home/HomeScreen'
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
              {
                path: 'joueurs',
                lazy: async () => ({
                  Component: (await import('@/features/players/PlayersScreen')).PlayersScreen,
                }),
              },
              {
                path: 'defis',
                lazy: async () => ({
                  Component: (await import('@/features/dares/MyDaresScreen')).MyDaresScreen,
                }),
              },
              {
                path: 'profil',
                lazy: async () => ({
                  Component: (await import('@/features/profile/ProfileScreen')).ProfileScreen,
                }),
              },
            ],
          },
          {
            path: 'joueurs/:playerId',
            lazy: async () => ({
              Component: (await import('@/features/players/PlayerEditorScreen')).PlayerEditorScreen,
            }),
          },
          {
            path: 'regles',
            lazy: async () => ({
              Component: (await import('@/features/guide/RulesScreen')).RulesScreen,
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
