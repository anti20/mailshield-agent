import SwiftUI

struct RiskBadgeView: View {
    let riskLevel: RiskLevel
    let riskScore: Int

    private var color: Color {
        switch riskLevel {
        case .low:
            .green
        case .medium:
            .orange
        case .high, .critical:
            .red
        }
    }

    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)

            Text("\(riskLevel.rawValue.capitalized) risk")
                .font(.caption)
                .fontWeight(.medium)

            Text("Score \(riskScore)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(color.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
