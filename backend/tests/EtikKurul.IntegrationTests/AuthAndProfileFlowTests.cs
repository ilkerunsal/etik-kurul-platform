using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using EtikKurul.Api.Contracts.Applications;
using EtikKurul.Api.Contracts.Auth;
using EtikKurul.Api.Contracts.Profile;
using EtikKurul.Infrastructure.Entities;
using EtikKurul.Infrastructure.Enums;
using EtikKurul.Infrastructure.Persistence;
using EtikKurul.IntegrationTests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace EtikKurul.IntegrationTests;

public class AuthAndProfileFlowTests : IClassFixture<TestWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = CreateJsonOptions();
    private readonly TestWebApplicationFactory _factory;

    public AuthAndProfileFlowTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _factory.IdentityProvider.ShouldSucceed = true;
    }

    [Fact]
    public async Task Register_PersistsEncryptedIdentityFields_AndAssignsResearcherRole()
    {
        var client = _factory.CreateClient();
        var response = await PostJsonAsync(client, "/auth/register", BuildRegisterRequest("11111111111"));

        response.EnsureSuccessStatusCode();
        var payload = await ReadJsonAsync<RegisterResponse>(response);
        Assert.NotNull(payload);
        Assert.Equal(AccountStatus.PendingIdentityCheck, payload.AccountStatus);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await db.Users.FindAsync(payload!.UserId);
        Assert.NotNull(user);
        Assert.NotEqual("11111111111", user!.TcknEncrypted);
        Assert.DoesNotContain("1990-01-01", user.BirthDateEncrypted);

        var userRole = db.UserRoles.Single(x => x.UserId == payload.UserId);
        var role = db.Roles.Single(x => x.Id == userRole.RoleId);
        Assert.Equal("researcher", role.Code);
    }

    [Fact]
    public async Task VerifyIdentity_ThenConfirmCode_ActivatesUser_AndAllowsProfileCreation()
    {
        var client = _factory.CreateClient();
        var registerRequest = BuildRegisterRequest("22222222222");
        var registerResponse = await PostJsonAsync(client, "/auth/register", registerRequest);
        var registerPayload = await ReadJsonAsync<RegisterResponse>(registerResponse);

        var verifyResponse = await PostJsonAsync(client, "/auth/verify-identity", new VerifyIdentityRequest { UserId = registerPayload!.UserId });
        verifyResponse.EnsureSuccessStatusCode();
        var verifyPayload = await ReadJsonAsync<VerifyIdentityResponse>(verifyResponse);

        Assert.NotNull(verifyPayload);
        Assert.True(verifyPayload!.Success);
        Assert.Equal(AccountStatus.ContactPending, verifyPayload.AccountStatus);

        var code = _factory.EmailProvider.ExtractLatestCode();
        var confirmResponse = await PostJsonAsync(
            client,
            "/auth/confirm-code",
            new ConfirmContactCodeRequest
            {
                UserId = registerPayload.UserId,
                ChannelType = ContactChannelType.Email,
                Code = code,
            });

        confirmResponse.EnsureSuccessStatusCode();
        var confirmPayload = await ReadJsonAsync<ConfirmContactCodeResponse>(confirmResponse);
        Assert.NotNull(confirmPayload);
        Assert.Equal(AccountStatus.Active, confirmPayload!.AccountStatus);
        Assert.True(confirmPayload.EmailVerified);

        var loginResponse = await PostJsonAsync(
            client,
            "/auth/login",
            new LoginRequest
            {
                EmailOrPhone = registerRequest.Email,
                Password = "Password1",
            });

        loginResponse.EnsureSuccessStatusCode();
        var loginPayload = await ReadJsonAsync<LoginResponse>(loginResponse);
        Assert.NotNull(loginPayload);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginPayload!.AccessToken);

        var profileResponse = await PostJsonAsync(
            client,
            "/profile",
            new CreateProfileRequest
            {
                AcademicTitle = "Dr.",
                DegreeLevel = "PhD",
                InstitutionName = "Hacettepe",
                FacultyName = "Tıp",
                DepartmentName = "Bilişim",
                PositionTitle = "Araştırmacı",
                Biography = "Bio",
                SpecializationSummary = "Summary",
                HasESignature = true,
                KepAddress = "kep@example.com",
                CvDocumentId = Guid.NewGuid(),
            });

        profileResponse.EnsureSuccessStatusCode();
        var profilePayload = await ReadJsonAsync<CreateProfileResponse>(profileResponse);
        Assert.NotNull(profilePayload);
        Assert.Equal(100, profilePayload!.ProfileCompletionPercent);

        var currentProfileResponse = await client.GetAsync("/profile/me");
        currentProfileResponse.EnsureSuccessStatusCode();
        var currentProfilePayload = await ReadJsonAsync<CurrentProfileResponse>(currentProfileResponse);
        Assert.NotNull(currentProfilePayload);
        Assert.Equal("Dr.", currentProfilePayload!.AcademicTitle);
        Assert.Equal(profilePayload.ProfileCompletionPercent, currentProfilePayload.ProfileCompletionPercent);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var storedUser = await db.Users.FindAsync(registerPayload.UserId);
        var identityCheck = db.UserIdentityChecks.Single(x => x.UserId == registerPayload.UserId);
        Assert.Equal(AccountStatus.Active, storedUser!.AccountStatus);
        Assert.DoesNotContain("22222222222", identityCheck.ResultMaskedJson);
    }

    [Fact]
    public async Task Profile_RequiresAuthenticatedUser()
    {
        var client = _factory.CreateClient();
        var registerRequest = BuildRegisterRequest("55555555555");
        var registerResponse = await PostJsonAsync(client, "/auth/register", registerRequest);
        var registerPayload = await ReadJsonAsync<RegisterResponse>(registerResponse);

        await PostJsonAsync(client, "/auth/verify-identity", new VerifyIdentityRequest { UserId = registerPayload!.UserId });
        var code = _factory.EmailProvider.ExtractLatestCode();

        await PostJsonAsync(
            client,
            "/auth/confirm-code",
            new ConfirmContactCodeRequest
            {
                UserId = registerPayload.UserId,
                ChannelType = ContactChannelType.Email,
                Code = code,
            });

        var profileResponse = await PostJsonAsync(
            client,
            "/profile",
            new CreateProfileRequest
            {
                AcademicTitle = "Dr.",
                DegreeLevel = "PhD",
                InstitutionName = "Hacettepe",
                FacultyName = "Tip",
                DepartmentName = "Bilisim",
                PositionTitle = "Arastirmaci",
                Biography = "Bio",
                SpecializationSummary = "Summary",
                HasESignature = true,
                KepAddress = "kep@example.com",
                CvDocumentId = Guid.NewGuid(),
            });

        Assert.Equal(HttpStatusCode.Unauthorized, profileResponse.StatusCode);
    }

    [Fact]
    public async Task ProfileMe_ReturnsNotFound_WhenProfileDoesNotExist()
    {
        var client = _factory.CreateClient();
        var registerRequest = BuildRegisterRequest("66666666666");
        var registerResponse = await PostJsonAsync(client, "/auth/register", registerRequest);
        var registerPayload = await ReadJsonAsync<RegisterResponse>(registerResponse);

        await PostJsonAsync(client, "/auth/verify-identity", new VerifyIdentityRequest { UserId = registerPayload!.UserId });
        var code = _factory.EmailProvider.ExtractLatestCode();

        await PostJsonAsync(
            client,
            "/auth/confirm-code",
            new ConfirmContactCodeRequest
            {
                UserId = registerPayload.UserId,
                ChannelType = ContactChannelType.Email,
                Code = code,
            });

        var loginResponse = await PostJsonAsync(
            client,
            "/auth/login",
            new LoginRequest
            {
                EmailOrPhone = registerRequest.Email,
                Password = "Password1",
            });

        var loginPayload = await ReadJsonAsync<LoginResponse>(loginResponse);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginPayload!.AccessToken);

        var profileResponse = await client.GetAsync("/profile/me");

        Assert.Equal(HttpStatusCode.NotFound, profileResponse.StatusCode);
    }

    [Fact]
    public async Task ApplicationAccess_ReturnsProfileMissing_WhenUserHasNoProfile()
    {
        var client = _factory.CreateClient();
        var registerRequest = BuildRegisterRequest("88888888888");
        var registerResponse = await PostJsonAsync(client, "/auth/register", registerRequest);
        var registerPayload = await ReadJsonAsync<RegisterResponse>(registerResponse);

        await PostJsonAsync(client, "/auth/verify-identity", new VerifyIdentityRequest { UserId = registerPayload!.UserId });
        var code = _factory.EmailProvider.ExtractLatestCode();

        await PostJsonAsync(
            client,
            "/auth/confirm-code",
            new ConfirmContactCodeRequest
            {
                UserId = registerPayload.UserId,
                ChannelType = ContactChannelType.Email,
                Code = code,
            });

        var loginResponse = await PostJsonAsync(
            client,
            "/auth/login",
            new LoginRequest
            {
                EmailOrPhone = registerRequest.Email,
                Password = "Password1",
            });

        var loginPayload = await ReadJsonAsync<LoginResponse>(loginResponse);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginPayload!.AccessToken);

        var accessResponse = await client.GetAsync("/auth/application-access");
        accessResponse.EnsureSuccessStatusCode();
        var accessPayload = await ReadJsonAsync<CurrentApplicationAccessResponse>(accessResponse);

        Assert.NotNull(accessPayload);
        Assert.False(accessPayload!.Access.CanOpenApplication);
        Assert.Equal("profile_missing", accessPayload.Access.ReasonCode);
    }

    [Fact]
    public async Task ApplicationAccessProbe_ReturnsForbidden_WhenPolicyIsNotSatisfied()
    {
        var client = _factory.CreateClient();
        var registerRequest = BuildRegisterRequest("99999999999");
        var registerResponse = await PostJsonAsync(client, "/auth/register", registerRequest);
        var registerPayload = await ReadJsonAsync<RegisterResponse>(registerResponse);

        await PostJsonAsync(client, "/auth/verify-identity", new VerifyIdentityRequest { UserId = registerPayload!.UserId });
        var code = _factory.EmailProvider.ExtractLatestCode();

        await PostJsonAsync(
            client,
            "/auth/confirm-code",
            new ConfirmContactCodeRequest
            {
                UserId = registerPayload.UserId,
                ChannelType = ContactChannelType.Email,
                Code = code,
            });

        var loginResponse = await PostJsonAsync(
            client,
            "/auth/login",
            new LoginRequest
            {
                EmailOrPhone = registerRequest.Email,
                Password = "Password1",
            });

        var loginPayload = await ReadJsonAsync<LoginResponse>(loginResponse);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginPayload!.AccessToken);

        var probeResponse = await client.GetAsync("/auth/application-access/probe");

        Assert.Equal(HttpStatusCode.Forbidden, probeResponse.StatusCode);

        var createApplicationResponse = await client.PostAsync("/applications", content: null);

        Assert.Equal(HttpStatusCode.Forbidden, createApplicationResponse.StatusCode);
    }

    [Fact]
    public async Task ApplicationWorkflow_CompletesValidation_WhenConfiguredThresholdIsMet()
    {
        using var configuredFactory = new TestWebApplicationFactory(minimumProfileCompletionPercent: 100);
        configuredFactory.IdentityProvider.ShouldSucceed = true;

        var client = configuredFactory.CreateClient();
        var registerRequest = BuildRegisterRequest("10101010101");
        var registerResponse = await PostJsonAsync(client, "/auth/register", registerRequest);
        var registerPayload = await ReadJsonAsync<RegisterResponse>(registerResponse);

        await PostJsonAsync(client, "/auth/verify-identity", new VerifyIdentityRequest { UserId = registerPayload!.UserId });
        var code = configuredFactory.EmailProvider.ExtractLatestCode();

        await PostJsonAsync(
            client,
            "/auth/confirm-code",
            new ConfirmContactCodeRequest
            {
                UserId = registerPayload.UserId,
                ChannelType = ContactChannelType.Email,
                Code = code,
            });

        var loginResponse = await PostJsonAsync(
            client,
            "/auth/login",
            new LoginRequest
            {
                EmailOrPhone = registerRequest.Email,
                Password = "Password1",
            });

        var loginPayload = await ReadJsonAsync<LoginResponse>(loginResponse);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginPayload!.AccessToken);

        await PostJsonAsync(
            client,
            "/profile",
            new CreateProfileRequest
            {
                AcademicTitle = "Prof.",
                DegreeLevel = "PhD",
                InstitutionName = "Hacettepe",
                FacultyName = "Tip",
                DepartmentName = "Bilisim",
                PositionTitle = "Ogretim Uyesi",
                Biography = "Updated bio",
                SpecializationSummary = "Updated summary",
                HasESignature = true,
                KepAddress = "kep@example.com",
                CvDocumentId = Guid.NewGuid(),
            });

        var accessResponse = await client.GetAsync("/auth/application-access");
        accessResponse.EnsureSuccessStatusCode();
        var accessPayload = await ReadJsonAsync<CurrentApplicationAccessResponse>(accessResponse);
        Assert.NotNull(accessPayload);
        Assert.True(accessPayload!.Access.CanOpenApplication);
        Assert.Equal("ready", accessPayload.Access.ReasonCode);

        var probeResponse = await client.GetAsync("/auth/application-access/probe");
        probeResponse.EnsureSuccessStatusCode();
        var probePayload = await ReadJsonAsync<ApplicationAccessProbeResponse>(probeResponse);
        Assert.NotNull(probePayload);
        Assert.Equal("ready", probePayload!.Status);

        var createApplicationResponse = await PostJsonAsync(
            client,
            "/applications",
            new CreateApplicationRequest("Klinik Arastirma", "Faz 1 smoke benzeri entegrasyon testi"));
        Assert.Equal(HttpStatusCode.Created, createApplicationResponse.StatusCode);
        var createApplicationPayload = await ReadJsonAsync<ApplicationSummaryResponse>(createApplicationResponse);
        Assert.NotNull(createApplicationPayload);
        Assert.Equal(ApplicationStatus.Draft, createApplicationPayload!.Status);
        Assert.Equal(ApplicationCurrentStep.Draft, createApplicationPayload.CurrentStep);
        Assert.Equal("Klinik Arastirma", createApplicationPayload.Title);

        var committeesResponse = await client.GetAsync("/committees");
        committeesResponse.EnsureSuccessStatusCode();
        var committeesPayload = await ReadJsonAsync<List<CommitteeLookupResponse>>(committeesResponse);
        Assert.NotNull(committeesPayload);
        Assert.NotEmpty(committeesPayload!);
        var committee = committeesPayload!.First();

        var entryModeResponse = await PostJsonAsync(
            client,
            $"/applications/{createApplicationPayload.ApplicationId}/entry-mode",
            new SetApplicationEntryModeRequest(ApplicationEntryMode.Guided));
        entryModeResponse.EnsureSuccessStatusCode();
        var entryModePayload = await ReadJsonAsync<ApplicationSummaryResponse>(entryModeResponse);
        Assert.NotNull(entryModePayload);
        Assert.Equal(ApplicationEntryMode.Guided, entryModePayload!.EntryMode);
        Assert.Equal(ApplicationCurrentStep.IntakeInProgress, entryModePayload.CurrentStep);

        var intakeResponse = await PostJsonAsync(
            client,
            $"/applications/{createApplicationPayload.ApplicationId}/intake",
            new SaveApplicationIntakeRequest(
                JsonSerializer.SerializeToElement(new
                {
                    researchArea = "clinical",
                    requiresSpecialReview = false,
                }),
                committee.CommitteeId,
                JsonSerializer.SerializeToElement(new[] { committee.CommitteeId }),
                0.94m,
                "Yonlendirme mock intake cevaplariyla belirlendi."));
        intakeResponse.EnsureSuccessStatusCode();
        var intakePayload = await ReadJsonAsync<RoutingAssessmentResponse>(intakeResponse);
        Assert.NotNull(intakePayload);
        Assert.Equal(committee.CommitteeId, intakePayload!.SuggestedCommitteeId);
        Assert.Equal(ApplicationCurrentStep.IntakeInProgress, intakePayload.Application.CurrentStep);

        var committeeResponse = await PostJsonAsync(
            client,
            $"/applications/{createApplicationPayload.ApplicationId}/committee",
            new SelectApplicationCommitteeRequest(committee.CommitteeId, "guided"));
        committeeResponse.EnsureSuccessStatusCode();
        var committeePayload = await ReadJsonAsync<ApplicationSummaryResponse>(committeeResponse);
        Assert.NotNull(committeePayload);
        Assert.Equal(committee.CommitteeId, committeePayload!.CommitteeId);
        Assert.Equal(ApplicationCurrentStep.CommitteeSelected, committeePayload.CurrentStep);

        var formResponse = await PostJsonAsync(
            client,
            $"/applications/{createApplicationPayload.ApplicationId}/forms/clinical-main",
            new SaveApplicationFormRequest(
                1,
                JsonSerializer.SerializeToElement(new
                {
                    studyTitle = "Klinik Arastirma",
                    participantCount = 12,
                }),
                100));
        formResponse.EnsureSuccessStatusCode();
        var formPayload = await ReadJsonAsync<ApplicationFormResponse>(formResponse);
        Assert.NotNull(formPayload);
        Assert.Equal(100, formPayload!.CompletionPercent);
        Assert.Equal(ApplicationCurrentStep.ApplicationInPreparation, formPayload.Application.CurrentStep);

        var documentResponse = await PostJsonAsync(
            client,
            $"/applications/{createApplicationPayload.ApplicationId}/documents",
            new AddApplicationDocumentRequest(
                "consent_form",
                "upload",
                "consent.pdf",
                "mock://documents/consent.pdf",
                "application/pdf",
                1,
                true));
        documentResponse.EnsureSuccessStatusCode();
        var documentPayload = await ReadJsonAsync<ApplicationDocumentResponse>(documentResponse);
        Assert.NotNull(documentPayload);
        Assert.Equal("pending", documentPayload!.ValidationStatus);
        Assert.True(documentPayload.IsRequired);

        var validateResponse = await client.PostAsync($"/applications/{createApplicationPayload.ApplicationId}/validate", content: null);
        validateResponse.EnsureSuccessStatusCode();
        var validatePayload = await ReadJsonAsync<ApplicationValidationResponse>(validateResponse);
        Assert.NotNull(validatePayload);
        Assert.True(validatePayload!.IsValid);
        Assert.Equal(ApplicationCurrentStep.ValidationPassed, validatePayload.CurrentStep);
        Assert.Contains(validatePayload.Items, x => x.ItemCode == "profile_ready" && x.Status == ApplicationChecklistStatus.Passed);
        Assert.Contains(validatePayload.Items, x => x.ItemCode == "required_documents_status" && x.Status == ApplicationChecklistStatus.Passed);
    }

    [Fact]
    public async Task ApplicationValidation_ReturnsBlocked_WhenDraftIsIncomplete()
    {
        using var configuredFactory = new TestWebApplicationFactory(minimumProfileCompletionPercent: 100);
        configuredFactory.IdentityProvider.ShouldSucceed = true;

        var client = configuredFactory.CreateClient();
        var registerRequest = BuildRegisterRequest("20202020202");
        var registerResponse = await PostJsonAsync(client, "/auth/register", registerRequest);
        var registerPayload = await ReadJsonAsync<RegisterResponse>(registerResponse);

        await PostJsonAsync(client, "/auth/verify-identity", new VerifyIdentityRequest { UserId = registerPayload!.UserId });
        var code = configuredFactory.EmailProvider.ExtractLatestCode();

        await PostJsonAsync(
            client,
            "/auth/confirm-code",
            new ConfirmContactCodeRequest
            {
                UserId = registerPayload.UserId,
                ChannelType = ContactChannelType.Email,
                Code = code,
            });

        var loginResponse = await PostJsonAsync(
            client,
            "/auth/login",
            new LoginRequest
            {
                EmailOrPhone = registerRequest.Email,
                Password = "Password1",
            });

        var loginPayload = await ReadJsonAsync<LoginResponse>(loginResponse);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginPayload!.AccessToken);

        await PostJsonAsync(
            client,
            "/profile",
            new CreateProfileRequest
            {
                AcademicTitle = "Prof.",
                DegreeLevel = "PhD",
                InstitutionName = "Hacettepe",
                FacultyName = "Tip",
                DepartmentName = "Bilisim",
                PositionTitle = "Ogretim Uyesi",
                Biography = "Updated bio",
                SpecializationSummary = "Updated summary",
                HasESignature = true,
                KepAddress = "kep@example.com",
                CvDocumentId = Guid.NewGuid(),
            });

        var createApplicationResponse = await PostJsonAsync(
            client,
            "/applications",
            new CreateApplicationRequest("Eksik Basvuru", "Validation base negatif senaryosu"));
        createApplicationResponse.EnsureSuccessStatusCode();
        var createApplicationPayload = await ReadJsonAsync<ApplicationSummaryResponse>(createApplicationResponse);

        var validateResponse = await client.PostAsync($"/applications/{createApplicationPayload!.ApplicationId}/validate", content: null);
        validateResponse.EnsureSuccessStatusCode();
        var validatePayload = await ReadJsonAsync<ApplicationValidationResponse>(validateResponse);

        Assert.NotNull(validatePayload);
        Assert.False(validatePayload!.IsValid);
        Assert.Equal(ApplicationCurrentStep.ValidationFailed, validatePayload.CurrentStep);
        Assert.Contains(validatePayload.Items, x => x.ItemCode == "entry_mode_selected" && x.Status == ApplicationChecklistStatus.Blocked);
        Assert.Contains(validatePayload.Items, x => x.ItemCode == "intake_completed" && x.Status == ApplicationChecklistStatus.Blocked);
        Assert.Contains(validatePayload.Items, x => x.ItemCode == "committee_selected" && x.Status == ApplicationChecklistStatus.Blocked);
        Assert.Contains(validatePayload.Items, x => x.ItemCode == "forms_present" && x.Status == ApplicationChecklistStatus.Blocked);
    }

    [Fact]
    public async Task ProfileMe_UpdatesExistingProfile_AndRefreshesCompletion()
    {
        var client = _factory.CreateClient();
        var registerRequest = BuildRegisterRequest("77777777777");
        var registerResponse = await PostJsonAsync(client, "/auth/register", registerRequest);
        var registerPayload = await ReadJsonAsync<RegisterResponse>(registerResponse);

        await PostJsonAsync(client, "/auth/verify-identity", new VerifyIdentityRequest { UserId = registerPayload!.UserId });
        var code = _factory.EmailProvider.ExtractLatestCode();

        await PostJsonAsync(
            client,
            "/auth/confirm-code",
            new ConfirmContactCodeRequest
            {
                UserId = registerPayload.UserId,
                ChannelType = ContactChannelType.Email,
                Code = code,
            });

        var loginResponse = await PostJsonAsync(
            client,
            "/auth/login",
            new LoginRequest
            {
                EmailOrPhone = registerRequest.Email,
                Password = "Password1",
            });

        var loginPayload = await ReadJsonAsync<LoginResponse>(loginResponse);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginPayload!.AccessToken);

        var createResponse = await PostJsonAsync(
            client,
            "/profile",
            new CreateProfileRequest
            {
                AcademicTitle = "Dr.",
                DegreeLevel = "PhD",
                InstitutionName = "Hacettepe",
                FacultyName = "Tip",
                DepartmentName = "Bilisim",
                PositionTitle = "Arastirmaci",
                Biography = "Bio",
                SpecializationSummary = "Summary",
                HasESignature = true,
                KepAddress = "kep@example.com",
                CvDocumentId = null,
            });

        createResponse.EnsureSuccessStatusCode();
        var createPayload = await ReadJsonAsync<CreateProfileResponse>(createResponse);
        Assert.NotNull(createPayload);
        Assert.Equal(91, createPayload!.ProfileCompletionPercent);

        var updateResponse = await PutJsonAsync(
            client,
            "/profile/me",
            new CreateProfileRequest
            {
                AcademicTitle = "Prof.",
                DegreeLevel = "PhD",
                InstitutionName = "Hacettepe",
                FacultyName = "Tip",
                DepartmentName = "Bilisim",
                PositionTitle = "Ogretim Uyesi",
                Biography = "Updated bio",
                SpecializationSummary = "Updated summary",
                HasESignature = true,
                KepAddress = "kep@example.com",
                CvDocumentId = Guid.NewGuid(),
            });

        updateResponse.EnsureSuccessStatusCode();
        var updatePayload = await ReadJsonAsync<CurrentProfileResponse>(updateResponse);
        Assert.NotNull(updatePayload);
        Assert.Equal("Prof.", updatePayload!.AcademicTitle);
        Assert.Equal(100, updatePayload.ProfileCompletionPercent);

        var currentProfileResponse = await client.GetAsync("/profile/me");
        currentProfileResponse.EnsureSuccessStatusCode();
        var currentProfilePayload = await ReadJsonAsync<CurrentProfileResponse>(currentProfileResponse);
        Assert.NotNull(currentProfilePayload);
        Assert.Equal("Prof.", currentProfilePayload!.AcademicTitle);
        Assert.Equal(100, currentProfilePayload.ProfileCompletionPercent);

        var currentUserResponse = await client.GetAsync("/auth/me");
        currentUserResponse.EnsureSuccessStatusCode();
        var currentUserPayload = await ReadJsonAsync<CurrentUserResponse>(currentUserResponse);
        Assert.NotNull(currentUserPayload);
        Assert.Equal(100, currentUserPayload!.User.ProfileCompletionPercent);
    }

    [Fact]
    public async Task VerifyIdentity_Failure_SetsIdentityFailed_AndBlocksSendCode()
    {
        var client = _factory.CreateClient();
        _factory.IdentityProvider.ShouldSucceed = false;

        var registerResponse = await PostJsonAsync(client, "/auth/register", BuildRegisterRequest("33333333333"));
        var registerPayload = await ReadJsonAsync<RegisterResponse>(registerResponse);

        var verifyResponse = await PostJsonAsync(client, "/auth/verify-identity", new VerifyIdentityRequest { UserId = registerPayload!.UserId });
        verifyResponse.EnsureSuccessStatusCode();
        var verifyPayload = await ReadJsonAsync<VerifyIdentityResponse>(verifyResponse);

        Assert.NotNull(verifyPayload);
        Assert.False(verifyPayload!.Success);
        Assert.Equal(AccountStatus.IdentityFailed, verifyPayload.AccountStatus);

        var sendCodeResponse = await PostJsonAsync(
            client,
            "/auth/send-code",
            new SendContactCodeRequest
            {
                UserId = registerPayload.UserId,
                ChannelType = ContactChannelType.Sms,
            });

        Assert.Equal(HttpStatusCode.BadRequest, sendCodeResponse.StatusCode);
        _factory.IdentityProvider.ShouldSucceed = true;
    }

    [Fact]
    public async Task ConfirmCode_RejectsExpiredCodes()
    {
        var client = _factory.CreateClient();
        var registerResponse = await PostJsonAsync(client, "/auth/register", BuildRegisterRequest("44444444444"));
        var registerPayload = await ReadJsonAsync<RegisterResponse>(registerResponse);

        await PostJsonAsync(client, "/auth/verify-identity", new VerifyIdentityRequest { UserId = registerPayload!.UserId });
        var code = _factory.EmailProvider.ExtractLatestCode();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var verificationCode = db.UserVerificationCodes
                .Single(x => x.UserId == registerPayload.UserId && x.ChannelType == ContactChannelType.Email);
            verificationCode.ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-1);
            await db.SaveChangesAsync();
        }

        var confirmResponse = await PostJsonAsync(
            client,
            "/auth/confirm-code",
            new ConfirmContactCodeRequest
            {
                UserId = registerPayload.UserId,
                ChannelType = ContactChannelType.Email,
                Code = code,
            });

        Assert.Equal(HttpStatusCode.BadRequest, confirmResponse.StatusCode);
    }

    private static RegisterRequest BuildRegisterRequest(string tckn)
    {
        return new RegisterRequest
        {
            FirstName = "Ada",
            LastName = "Lovelace",
            Tckn = tckn,
            BirthDate = new DateOnly(1990, 1, 1),
            Email = $"{tckn}@example.com",
            Phone = $"+90555{tckn[^7..]}",
            Password = "Password1",
        };
    }

    private static JsonSerializerOptions CreateJsonOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }

    private static Task<HttpResponseMessage> PostJsonAsync<T>(HttpClient client, string uri, T payload)
        => client.PostAsJsonAsync(uri, payload, JsonOptions);

    private static Task<HttpResponseMessage> PutJsonAsync<T>(HttpClient client, string uri, T payload)
        => client.PutAsJsonAsync(uri, payload, JsonOptions);

    private static Task<T?> ReadJsonAsync<T>(HttpResponseMessage response)
        => response.Content.ReadFromJsonAsync<T>(JsonOptions);
}
