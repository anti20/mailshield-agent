import SwiftUI

struct GmailConnectionCardView: View {
    let oauthConfigurationStatus: String
    let oauthConfigurationMessage: String?
    let isOAuthConfigured: Bool
    let status: String
    let connectedEmailAddress: String?
    let statusMessage: String?
    let isLoading: Bool
    let refreshAction: () -> Void
    let openLoginAction: () -> Void

    private var statusColor: Color {
        switch status {
        case "Connected":
            .green
        case "Checking":
            .orange
        default:
            .secondary
        }
    }

    private var oauthStatusColor: Color {
        switch oauthConfigurationStatus {
        case "Configured":
            .green
        case "Checking":
            .orange
        default:
            .red
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: "person.crop.circle.badge.checkmark")
                    .font(.title2)
                    .foregroundStyle(statusColor)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Gmail connection: \(status)")
                        .font(.headline)

                    if let connectedEmailAddress, !connectedEmailAddress.isEmpty {
                        Text("Connected account: \(connectedEmailAddress)")
                            .foregroundStyle(.secondary)
                    } else {
                        Text("No Gmail account connected.")
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                if isLoading {
                    ProgressView()
                        .controlSize(.small)
                }
            }

            HStack(spacing: 8) {
                Image(systemName: "gearshape.2")
                    .foregroundStyle(oauthStatusColor)

                Text("Google OAuth app config: \(oauthConfigurationStatus)")
                    .font(.subheadline)
            }

            if let statusMessage {
                Text(statusMessage)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let oauthConfigurationMessage {
                Text(oauthConfigurationMessage)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 10) {
                Button {
                    refreshAction()
                } label: {
                    Label("Refresh Gmail status", systemImage: "arrow.clockwise")
                }
                .disabled(isLoading)

                if isOAuthConfigured {
                    Button {
                        openLoginAction()
                    } label: {
                        Label("Open Gmail login", systemImage: "safari")
                    }
                } else {
                    Text("Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to apps/core/.env")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(16)
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
