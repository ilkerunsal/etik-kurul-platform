using EtikKurul.Modules.UserProfiles.Models;
using EtikKurul.Modules.UserProfiles.Services;

namespace EtikKurul.UnitTests.Modules;

public class ProfileCompletionCalculatorTests
{
    [Fact]
    public void Calculate_Returns100_WhenAllFieldsAreCompleted()
    {
        var calculator = new ProfileCompletionCalculator();
        var command = new CreateProfileCommand(
            Guid.NewGuid(),
            "Dr.",
            "PhD",
            "Hacettepe",
            "Tıp",
            "Bilişim",
            "Araştırmacı",
            "Bio",
            "Summary",
            true,
            "kep@example.com",
            Guid.NewGuid());

        var result = calculator.Calculate(command);

        Assert.Equal(100, result);
    }

    [Fact]
    public void Calculate_CountsBooleanFieldAsAnswered()
    {
        var calculator = new ProfileCompletionCalculator();
        var command = new CreateProfileCommand(
            Guid.NewGuid(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            false,
            null,
            null);

        var result = calculator.Calculate(command);

        Assert.Equal(9, result);
    }
}
