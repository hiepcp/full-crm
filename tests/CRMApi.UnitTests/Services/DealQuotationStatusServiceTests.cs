using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Application.Services;
using CRMSys.Domain.Entities;
using Moq;
using Shared.ExternalServices.Interfaces;
using AutoMapper;
using Xunit;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;

namespace CRMSysApi.UnitTests.Services
{
    public class DealQuotationStatusServiceTests
    {
        private readonly Mock<IDealRepository> _mockDealRepository;
        private readonly Mock<IDealQuotationRepository> _mockDealQuotationRepository;
        private readonly Mock<IPipelineLogService> _mockPipelineLogService;
        private readonly Mock<IDynamicService> _mockDynamicService;
        private readonly Mock<IMapper> _mockMapper;
        private readonly DealQuotationStatusService _service;

        public DealQuotationStatusServiceTests()
        {
            _mockDealRepository = new Mock<IDealRepository>();
            _mockDealQuotationRepository = new Mock<IDealQuotationRepository>();
            _mockPipelineLogService = new Mock<IPipelineLogService>();
            _mockDynamicService = new Mock<IDynamicService>();
            _mockMapper = new Mock<IMapper>();

            _service = new DealQuotationStatusService(
                _mockDealRepository.Object,
                _mockDealQuotationRepository.Object,
                _mockPipelineLogService.Object,
                _mockDynamicService.Object,
                _mockMapper.Object
            );
        }

        [Fact]
        public async Task EvaluateAndUpdateDealStageAsync_DealNotFound_ShouldReturnEarly()
        {
            // Arrange
            long dealId = 1;
            _mockDealRepository.Setup(r => r.GetByIdAsync(dealId, default))
                .ReturnsAsync((Deal)null);

            // Act
            await _service.EvaluateAndUpdateDealStageAsync(dealId, "test@example.com");

            // Assert
            _mockPipelineLogService.Verify(s => s.LogStageChangeAsync(It.IsAny<long>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
        }

        [Fact]
        public async Task EvaluateAndUpdateDealStageAsync_WithApprovedQuotation_ShouldUpdateToClosedWon()
        {
            // Arrange
            long dealId = 1;
            var deal = new Deal { Id = dealId, Stage = "Proposal" };

            _mockDealRepository.Setup(r => r.GetByIdAsync(dealId, default))
                .ReturnsAsync(deal);

            // Mock quotation numbers
            var mockService = new Mock<DealQuotationStatusService>(
                _mockDealRepository.Object,
                _mockDealQuotationRepository.Object,
                _mockPipelineLogService.Object,
                _mockDynamicService.Object,
                _mockMapper.Object
            ) { CallBase = true };

            mockService.Setup(s => s.GetQuotationNumbersByDealIdAsync(dealId, default))
                .ReturnsAsync(new List<string> { "QT-001" });

            mockService.Setup(s => s.GetQuotationStatusesFromDynamicsAsync(It.IsAny<IEnumerable<string>>(), default))
                .ReturnsAsync(new List<string> { "Approved" });

            // Act
            await mockService.Object.EvaluateAndUpdateDealStageAsync(dealId, "test@example.com");

            // Assert
            deal.Stage.Should().Be("Closed Won");
            deal.IsClosed.Should().BeTrue();
            _mockDealRepository.Verify(r => r.UpdateAsync(deal, default), Times.Once);
            _mockPipelineLogService.Verify(s => s.LogStageChangeAsync(
                dealId, "Proposal", "Closed Won", "test@example.com", It.IsAny<string>(), default), Times.Once);
        }

        [Fact]
        public async Task EvaluateAndUpdateDealStageAsync_WithAllLostQuotations_ShouldUpdateToClosedLost()
        {
            // Arrange
            long dealId = 1;
            var deal = new Deal { Id = dealId, Stage = "Proposal" };

            _mockDealRepository.Setup(r => r.GetByIdAsync(dealId, default))
                .ReturnsAsync(deal);

            var mockService = new Mock<DealQuotationStatusService>(
                _mockDealRepository.Object,
                _mockDealQuotationRepository.Object,
                _mockPipelineLogService.Object,
                _mockDynamicService.Object,
                _mockMapper.Object
            ) { CallBase = true };

            mockService.Setup(s => s.GetQuotationNumbersByDealIdAsync(dealId, default))
                .ReturnsAsync(new List<string> { "QT-001", "QT-002" });

            mockService.Setup(s => s.GetQuotationStatusesFromDynamicsAsync(It.IsAny<IEnumerable<string>>(), default))
                .ReturnsAsync(new List<string> { "Lost", "Cancelled" });

            // Act
            await mockService.Object.EvaluateAndUpdateDealStageAsync(dealId, "test@example.com");

            // Assert
            deal.Stage.Should().Be("Closed Lost");
            deal.IsClosed.Should().BeTrue();
            _mockPipelineLogService.Verify(s => s.LogStageChangeAsync(
                dealId, "Proposal", "Closed Lost", "test@example.com", It.IsAny<string>(), default), Times.Once);
        }

        [Fact]
        public async Task EvaluateAndUpdateDealStageAsync_WithSentQuotation_ShouldUpdateToProposal()
        {
            // Arrange
            long dealId = 1;
            var deal = new Deal { Id = dealId, Stage = "Prospecting" };

            _mockDealRepository.Setup(r => r.GetByIdAsync(dealId, default))
                .ReturnsAsync(deal);

            var mockService = new Mock<DealQuotationStatusService>(
                _mockDealRepository.Object,
                _mockDealQuotationRepository.Object,
                _mockPipelineLogService.Object,
                _mockDynamicService.Object,
                _mockMapper.Object
            ) { CallBase = true };

            mockService.Setup(s => s.GetQuotationNumbersByDealIdAsync(dealId, default))
                .ReturnsAsync(new List<string> { "QT-001" });

            mockService.Setup(s => s.GetQuotationStatusesFromDynamicsAsync(It.IsAny<IEnumerable<string>>(), default))
                .ReturnsAsync(new List<string> { "Sent" });

            // Act
            await mockService.Object.EvaluateAndUpdateDealStageAsync(dealId, "test@example.com");

            // Assert
            deal.Stage.Should().Be("Proposal");
            _mockPipelineLogService.Verify(s => s.LogStageChangeAsync(
                dealId, "Prospecting", "Proposal", "test@example.com", It.IsAny<string>(), default), Times.Once);
        }

        [Fact]
        public async Task EvaluateAndUpdateDealStageAsync_NoStageChange_ShouldNotLogPipelineChange()
        {
            // Arrange
            long dealId = 1;
            var deal = new Deal { Id = dealId, Stage = "Proposal" };

            _mockDealRepository.Setup(r => r.GetByIdAsync(dealId, default))
                .ReturnsAsync(deal);

            var mockService = new Mock<DealQuotationStatusService>(
                _mockDealRepository.Object,
                _mockDealQuotationRepository.Object,
                _mockPipelineLogService.Object,
                _mockDynamicService.Object,
                _mockMapper.Object
            ) { CallBase = true };

            mockService.Setup(s => s.GetQuotationNumbersByDealIdAsync(dealId, default))
                .ReturnsAsync(new List<string> { "QT-001" });

            mockService.Setup(s => s.GetQuotationStatusesFromDynamicsAsync(It.IsAny<IEnumerable<string>>(), default))
                .ReturnsAsync(new List<string> { "Sent" });

            // Act
            await mockService.Object.EvaluateAndUpdateDealStageAsync(dealId, "test@example.com");

            // Assert - Stage should remain "Proposal", no pipeline log
            deal.Stage.Should().Be("Proposal");
            _mockPipelineLogService.Verify(s => s.LogStageChangeAsync(It.IsAny<long>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
        }

        [Fact]
        public async Task GetQuotationStatusesFromDynamicsAsync_ShouldReturnStatusesFromDynamics()
        {
            // Arrange
            var quotationNumbers = new List<string> { "QT-001", "QT-002" };

            var mockService = new Mock<DealQuotationStatusService>(
                _mockDealRepository.Object,
                _mockDealQuotationRepository.Object,
                _mockPipelineLogService.Object,
                _mockDynamicService.Object,
                _mockMapper.Object
            ) { CallBase = true };

            // Mock the private method by setting up the dynamic service call
            _mockDynamicService.Setup(d => d.GetODataAsync<Domain.Dynamics.SalesQuotationHeadersV2>(
                "SalesQuotationHeadersV2",
                It.IsAny<string>(),
                It.IsAny<string>(),
                default))
                .ReturnsAsync(new Shared.ExternalServices.Models.OdataMapper<Domain.Dynamics.SalesQuotationHeadersV2>
                {
                    Value = new List<Domain.Dynamics.SalesQuotationHeadersV2>
                    {
                        new Domain.Dynamics.SalesQuotationHeadersV2 { SalesQuotationStatus = "Approved" }
                    }
                });

            // Act
            var result = await mockService.Object.GetQuotationStatusesFromDynamicsAsync(quotationNumbers);

            // Assert
            result.Should().Contain("Approved");
        }
    }
}